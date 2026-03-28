import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { createAdminNotification } from "../services/adminNotification.service.js";

function getAccessSecret() {
  return process.env.JWT_ACCESS_SECRET;
}
function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET;
}

function signAccessToken(user) {
  const secret = getAccessSecret();
  return jwt.sign({ sub: user._id.toString(), role: user.role }, secret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
}

function signRefreshToken(user) {
  const secret = getRefreshSecret();
  return jwt.sign({ sub: user._id.toString(), type: "refresh" }, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function pruneRefreshTokens(user, { maxSessions = 5 } = {}) {
  const now = Date.now();
  const tokens = Array.isArray(user.refreshTokens) ? user.refreshTokens : [];

  const active = tokens.filter((t) => {
    if (!t) return false;
    if (t.revokedAt) return false;
    if (t.expiresAt && new Date(t.expiresAt).getTime() <= now) return false;
    return Boolean(t.tokenHash);
  });

  active.sort((a, b) => {
    const at = new Date(a.lastUsedAt || a.createdAt || 0).getTime();
    const bt = new Date(b.lastUsedAt || b.createdAt || 0).getTime();
    return bt - at;
  });

  user.refreshTokens = active.slice(0, Math.max(1, maxSessions));
}

function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";

  // Optional: set COOKIE_DOMAIN=.cashyourphone.com if you want cookies shared across subdomains.
  const domainRaw = String(process.env.COOKIE_DOMAIN || "").trim();
  const domain = domainRaw || undefined;

  // Safer default for same-site subdomains (cashyourphone.com, admin.cashyourphone.com, api.cashyourphone.com)
  // Only use SameSite=None if you *truly* need cross-site cookies.
  const sameSite =
    String(process.env.COOKIE_SAMESITE || (isProd ? "lax" : "lax")).toLowerCase();

  const secureEnv = String(process.env.COOKIE_SECURE || "").trim().toLowerCase();
  const secure = secureEnv ? secureEnv === "true" : isProd;

  return { isProd, sameSite, secure, domain };
}

function setAuthCookies(res, { accessToken, refreshToken }) {
  const { sameSite, secure, domain } = getCookieOptions();

  const common = {
    httpOnly: true,
    secure,
    sameSite,
    domain,
  };

  res.cookie("access_token", accessToken, {
    ...common,
    maxAge: 15 * 60 * 1000,
    path: "/",
  });

  res.cookie("refresh_token", refreshToken, {
    ...common,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth/refresh",
  });
}

function clearAuthCookies(res) {
  const { sameSite, secure, domain } = getCookieOptions();
  const common = {
    httpOnly: true,
    secure,
    sameSite,
    domain,
  };

  res.clearCookie("access_token", { ...common, path: "/" });
  res.clearCookie("refresh_token", { ...common, path: "/api/v1/auth/refresh" });
}

export async function register(req, res, next) {
  try {
    const { name, email, phone, password } = req.body || {};

    const phoneNorm = phone ? String(phone).trim() : "";
    const emailNorm = email ? String(email).toLowerCase().trim() : null;

    if (!name || !password || !phoneNorm) {
      return res.status(400).json({ message: "name + password + phone are required" });
    }

    const existing = await User.findOne({
      $or: [
        emailNorm ? { email: emailNorm } : null,
        phoneNorm ? { phone: phoneNorm } : null,
      ].filter(Boolean),
    });

    if (existing) return res.status(409).json({ message: "Account already exists" });

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);

    const user = await User.create({
      name: String(name).trim(),
      email: emailNorm || undefined,
      phone: phoneNorm,
      passwordHash,
      role: "user",
    });

    await createAdminNotification({
      type: "NEW_USER",
      entityModel: "User",
      entityId: user._id,
      message: `New user registered: ${user.name}`,
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokens.push({
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: req.get("user-agent") || "",
      ip: req.ip,
      lastUsedAt: new Date(),
    });

    pruneRefreshTokens(user, { maxSessions: Number(process.env.MAX_REFRESH_SESSIONS || 5) });
    await user.save();

    setAuthCookies(res, { accessToken, refreshToken });

    return res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { emailOrPhone, password } = req.body || {};
    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: "emailOrPhone + password are required" });
    }

    const key = String(emailOrPhone).trim();
    const user = await User.findOne({
      $or: [{ email: key.toLowerCase() }, { phone: key }],
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokens.push({
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: req.get("user-agent") || "",
      ip: req.ip,
      lastUsedAt: new Date(),
    });

    pruneRefreshTokens(user, { maxSessions: Number(process.env.MAX_REFRESH_SESSIONS || 5) });
    await user.save();

    setAuthCookies(res, { accessToken, refreshToken });

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (e) {
    next(e);
  }
}

export async function refresh(req, res) {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const secret = getRefreshSecret();
    if (!secret) return res.status(500).json({ message: "JWT secret missing" });

    const payload = jwt.verify(token, secret);
    if (payload.type !== "refresh") return res.status(401).json({ message: "Invalid refresh token" });

    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: "Invalid refresh token" });

    const tokenHash = hashToken(token);
    const record = (user.refreshTokens || []).find(
      (rt) => rt.tokenHash === tokenHash && !rt.revokedAt
    );
    if (!record) return res.status(401).json({ message: "Refresh token revoked" });

    if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    record.lastUsedAt = new Date();
    record.revokedAt = new Date(); // rotate

    pruneRefreshTokens(user, { maxSessions: Number(process.env.MAX_REFRESH_SESSIONS || 5) });

    const newAccess = signAccessToken(user);
    const newRefresh = signRefreshToken(user);

    user.refreshTokens.push({
      tokenHash: hashToken(newRefresh),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: req.get("user-agent") || "",
      ip: req.ip,
      lastUsedAt: new Date(),
    });

    await user.save();

    setAuthCookies(res, { accessToken: newAccess, refreshToken: newRefresh });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(401).json({ message: "Refresh failed", code: "REFRESH_FAILED" });
  }
}

export async function logout(req, res, next) {
  try {
    const token = req.cookies?.refresh_token;

    if (token) {
      const tokenHash = hashToken(token);
      await User.updateOne(
        { "refreshTokens.tokenHash": tokenHash },
        { $set: { "refreshTokens.$.revokedAt": new Date() } }
      );
    }

    clearAuthCookies(res);
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function logoutAll(req, res, next) {
  try {
    await User.updateOne({ _id: req.user.id }, { $set: { refreshTokens: [] } });
    clearAuthCookies(res);
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
