import crypto from "crypto";
import * as userService from "./user.service.js";
import User from "../../models/User.js";

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "lax" : "lax",
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  const options = getCookieOptions();
  res.cookie("access_token", accessToken, { ...options, maxAge: 15 * 60 * 1000, path: "/" });
  res.cookie("refresh_token", refreshToken, { ...options, maxAge: 30 * 24 * 60 * 60 * 1000, path: "/api/v1/user/refresh" });
};

export const register = async (req, res, next) => {
  try {
    const user = await userService.registerUser(req.body, req.ip, req.get("user-agent"));
    const accessToken = userService.signAccessToken(user);
    const refreshToken = userService.signRefreshToken(user);

    user.refreshTokens.push({
      tokenHash: crypto.createHash("sha256").update(refreshToken).digest("hex"),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: req.get("user-agent") || "",
      ip: req.ip,
      lastUsedAt: new Date(),
    });

    await user.save();
    setAuthCookies(res, { accessToken, refreshToken });

    res.status(201).json({
      status: "success",
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, phone, password, emailOrPhone } = req.body;
    const identifier = String(emailOrPhone || email || phone || "").trim();
    const user = await userService.loginUser(identifier, password);

    const accessToken = userService.signAccessToken(user);
    const refreshToken = userService.signRefreshToken(user);

    user.refreshTokens.push({
      tokenHash: crypto.createHash("sha256").update(refreshToken).digest("hex"),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: req.get("user-agent") || "",
      ip: req.ip,
      lastUsedAt: new Date(),
    });

    userService.pruneRefreshTokens(user);
    await user.save();
    setAuthCookies(res, { accessToken, refreshToken });

    res.status(200).json({
      status: "success",
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    const result = await userService.rotateRefreshToken(token, req.ip, req.get("user-agent"));
    setAuthCookies(res, result);
    res.status(200).json({ status: "success" });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await userService.logoutUser(req.cookies?.refresh_token);
    const options = getCookieOptions();
    res.clearCookie("access_token", { ...options, path: "/" });
    res.clearCookie("refresh_token", { ...options, path: "/api/v1/user/refresh" });
    res.status(200).json({ status: "success" });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash -refreshTokens");
    res.status(200).json({ status: "success", user });
  } catch (err) {
    next(err);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.status(200).json({ status: "success", user });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { identifier, method } = req.body;
    await userService.requestPasswordReset(identifier, method);
    
    // Always send 200 to prevent account enumeration
    res.status(200).json({
      status: "success",
      message: "If an account exists, reset instructions have been sent."
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, identifier, otp, newPassword } = req.body;
    await userService.resetPassword({ token, identifier, otp, newPassword });
    
    res.status(200).json({
      status: "success",
      message: "Password reset successful. Please log in again."
    });
  } catch (err) {
    next(err);
  }
};

