// server/src/controllers/authRecovery.controller.js
import crypto from "crypto";
import bcrypt from "bcrypt";
import User from "../models/User.js";
// import { sendEmail } from "../utils/email.js";
// import { sendSms } from "../utils/sms.js";

const OTP_TTL_MINUTES = 10;
const LINK_TTL_MINUTES = 15;
const MAX_OTP_ATTEMPTS = 5;

function isEmail(identifier = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(identifier).trim());
}

function normalizeIdentifier(identifier = "") {
  return String(identifier).trim();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateOtp() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

function nowPlusMinutes(m) {
  return new Date(Date.now() + m * 60 * 1000);
}

/**
 * POST /api/v1/auth/forgot-password
 * body: { identifier, method: "otp" | "email" }
 */
export async function forgotPassword(req, res, next) {
  try {
    const identifier = normalizeIdentifier(req.body?.identifier);
    const method = String(req.body?.method || "otp").toLowerCase();

    // Always respond OK (prevents account enumeration)
    const safeOk = () =>
      res.status(200).json({
        ok: true,
        message:
          "If an account exists, we sent reset instructions. Please check your inbox/SMS.",
      });

    if (!identifier) return safeOk();
    if (method !== "otp" && method !== "email") return safeOk();

    const query = isEmail(identifier)
      ? { email: identifier.toLowerCase() }
      : { phone: identifier };

    const user = await User.findOne(query);
    if (!user) return safeOk();

    if (method === "email") {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);

      user.passwordResetTokenHash = tokenHash;
      user.passwordResetTokenExpiresAt = nowPlusMinutes(LINK_TTL_MINUTES);

      // Clear OTP fields
      user.passwordResetOtpHash = null;
      user.passwordResetOtpExpiresAt = null;
      user.passwordResetOtpAttempts = 0;

      await user.save();

      const base = String(
        process.env.CLIENT_APP_URL || process.env.CLIENT_URL || ""
      ).trim();

      // In production, do NOT generate/log links if base is missing.
      if (process.env.NODE_ENV === "production" && !base) return safeOk();

      const resetUrl = `${base.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

      // TODO: send email
      // await sendEmail({ to: user.email, subject: "...", html: `...${resetUrl}...` });

      if (process.env.NODE_ENV !== "production") {
        console.log("[DEV] Password reset link:", resetUrl);
      }

      return safeOk();
    }

    // method === "otp"
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    user.passwordResetOtpHash = otpHash;
    user.passwordResetOtpExpiresAt = nowPlusMinutes(OTP_TTL_MINUTES);
    user.passwordResetOtpAttempts = 0;

    // Clear token fields
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;

    await user.save();

    // TODO: send OTP
    // if (isEmail(identifier)) await sendEmail(...);
    // else await sendSms(...);

    if (process.env.NODE_ENV !== "production") {
      console.log("[DEV] Password reset OTP:", otp, "for", identifier);
    }

    return safeOk();
  } catch (e) {
    return next(e);
  }
}

/**
 * POST /api/v1/auth/reset-password
 * body: { token?, identifier?, otp?, newPassword }
 */
export async function resetPassword(req, res, next) {
  try {
    const { token, identifier, otp, newPassword } = req.body || {};

    const newPass = String(newPassword || "");
    if (!newPass || newPass.length < 8) {
      return res
        .status(400)
        .json({ ok: false, message: "Password must be at least 8 characters." });
    }

    // EMAIL LINK FLOW
    if (token) {
      const tokenHash = hashToken(String(token));
      const user = await User.findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: { $gt: new Date() },
      });

      if (!user) {
        return res
          .status(400)
          .json({ ok: false, message: "Reset link is invalid or expired." });
      }

      user.passwordHash = await bcrypt.hash(newPass, 12);

      // revoke all sessions
      user.refreshTokens = [];

      // Clear reset fields
      user.passwordResetTokenHash = null;
      user.passwordResetTokenExpiresAt = null;
      user.passwordResetOtpHash = null;
      user.passwordResetOtpExpiresAt = null;
      user.passwordResetOtpAttempts = 0;

      await user.save();

      return res.status(200).json({ ok: true, message: "Password reset successful." });
    }

    // OTP FLOW
    const id = normalizeIdentifier(identifier);
    const code = String(otp || "").trim();

    if (!id || !code) {
      return res
        .status(400)
        .json({ ok: false, message: "Identifier and OTP are required." });
    }

    const query = isEmail(id) ? { email: id.toLowerCase() } : { phone: id };
    const user = await User.findOne(query);

    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      return res.status(400).json({ ok: false, message: "OTP is invalid or expired." });
    }

    if (user.passwordResetOtpExpiresAt <= new Date()) {
      return res
        .status(400)
        .json({ ok: false, message: "OTP expired. Please request again." });
    }

    if ((user.passwordResetOtpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        ok: false,
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    const ok = await bcrypt.compare(code, user.passwordResetOtpHash);
    if (!ok) {
      user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ ok: false, message: "OTP is invalid." });
    }

    user.passwordHash = await bcrypt.hash(newPass, 12);

    // revoke all sessions
    user.refreshTokens = [];

    // Clear reset fields
    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpiresAt = null;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;

    await user.save();

    return res.status(200).json({ ok: true, message: "Password reset successful." });
  } catch (e) {
    return next(e);
  }
}
