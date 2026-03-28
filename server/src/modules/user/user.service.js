import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import AppError from "../../utils/AppError.js";
import { createAdminNotification } from "../../services/adminNotification.service.js";

const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

/**
 * Sign JWT Access Token
 */
export const signAccessToken = (user) => {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, getAccessSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
};

/**
 * Sign JWT Refresh Token
 */
export const signRefreshToken = (user) => {
  return jwt.sign({ sub: user._id.toString(), type: "refresh" }, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
};

/**
 * Prune old refresh tokens (keep active sessions limited)
 */
export const pruneRefreshTokens = (user, maxSessions = 5) => {
  const now = Date.now();
  user.refreshTokens = (user.refreshTokens || [])
    .filter(t => t && !t.revokedAt && t.expiresAt && new Date(t.expiresAt).getTime() > now)
    .sort((a, b) => new Date(b.lastUsedAt || 0) - new Date(a.lastUsedAt || 0))
    .slice(0, maxSessions);
};

/**
 * REGISTER user
 */
export const registerUser = async (userData, ip, userAgent) => {
  const { name, email, phone, password } = userData;

  const existing = await User.findOne({
    $or: [
      email ? { email: email.toLowerCase() } : null,
      { phone: phone }
    ].filter(Boolean)
  });

  if (existing) throw new AppError("Account already exists with this email or phone", 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email: email ? email.toLowerCase() : undefined,
    phone,
    passwordHash,
    role: "user"
  });

  await createAdminNotification({
    type: "NEW_USER",
    entityModel: "User",
    entityId: user._id,
    message: `New user registered: ${user.name}`,
  });

  return user;
};

/**
 * LOGIN user
 */
export const loginUser = async (identifier, password) => {
  if (!identifier) throw new AppError("Please provide an email or phone number", 400);

  const user = await User.findOne({
    $or: [{ email: String(identifier).toLowerCase() }, { phone: String(identifier) }]
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Invalid credentials", 401);
  }

  return user;
};

/**
 * REFRESH tokens
 */
export const rotateRefreshToken = async (refreshToken, ip, userAgent) => {
  if (!refreshToken) throw new AppError("No refresh token provided", 401);
  const payload = jwt.verify(refreshToken, getRefreshSecret());
  if (payload.type !== "refresh") throw new AppError("Invalid refresh token", 401);

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError("User not found", 401);

  const tokenHash = hashToken(refreshToken);
  const record = user.refreshTokens.find((rt) => rt.tokenHash === tokenHash && !rt.revokedAt);
  
  if (!record || (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now())) {
    throw new AppError("Refresh token invalid or expired", 401);
  }

  // Rotate: revoke current and issue new
  record.revokedAt = new Date();
  
  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  user.refreshTokens.push({
    tokenHash: hashToken(newRefreshToken),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    userAgent: userAgent || "",
    ip: ip,
    lastUsedAt: new Date(),
  });

  pruneRefreshTokens(user);
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * LOGOUT user
 */
export const logoutUser = async (refreshToken) => {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await User.updateOne(
      { "refreshTokens.tokenHash": tokenHash },
      { $set: { "refreshTokens.$.revokedAt": new Date() } }
    );
  }
};

/**
 * FORGOT password (request reset)
 */
export const requestPasswordReset = async (identifier, method = "otp") => {
  const query = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
    ? { email: identifier.toLowerCase() }
    : { phone: identifier };

  const user = await User.findOne(query);
  if (!user) return; // Silent return for security

  if (method === "email") {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    await user.save();

    // In dev, log the link
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Password reset link: ${process.env.CLIENT_APP_URL}/reset-password?token=${rawToken}`);
    }
    return { method: "email", token: rawToken };
  } else {
    // OTP method
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);

    user.passwordResetOtpHash = otpHash;
    user.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    user.passwordResetOtpAttempts = 0;
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;
    await user.save();

    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Password reset OTP: ${otp} for ${identifier}`);
    }
    return { method: "otp", otp };
  }
};

/**
 * RESET password
 */
export const resetPassword = async ({ token, identifier, otp, newPassword }) => {
  let user;

  if (token) {
    const tokenHash = hashToken(token);
    user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpiresAt: { $gt: new Date() },
    });
  } else if (identifier && otp) {
    const query = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };
    user = await User.findOne(query);

    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt || user.passwordResetOtpExpiresAt <= new Date()) {
      throw new AppError("Invalid or expired OTP", 400);
    }

    if ((user.passwordResetOtpAttempts || 0) >= 5) {
      throw new AppError("Too many attempts. Please request a new OTP.", 429);
    }

    const ok = await bcrypt.compare(otp, user.passwordResetOtpHash);
    if (!ok) {
      user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
      await user.save();
      throw new AppError("Invalid OTP", 400);
    }
  }

  if (!user) throw new AppError("Invalid or expired reset credentials", 400);

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.refreshTokens = []; // Revoke all sessions
  user.passwordResetTokenHash = null;
  user.passwordResetTokenExpiresAt = null;
  user.passwordResetOtpHash = null;
  user.passwordResetOtpExpiresAt = null;
  user.passwordResetOtpAttempts = 0;
  await user.save();

  return user;
};

