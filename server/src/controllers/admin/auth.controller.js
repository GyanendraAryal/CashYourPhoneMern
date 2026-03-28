import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import AdminUser from "../../models/AdminUser.js";
import asyncHandler from "../../utils/asyncHandler.js";

function setAdminCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("admin_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
    path: "/",
  });
}

function clearAdminCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("admin_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await AdminUser.findOne({
    email: String(email).trim().toLowerCase(),
  });

  if (!user || user.disabled) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "ADMIN_JWT_SECRET is not configured." });
  }

  const role = String(user.role || "admin").toLowerCase();

  const token = jwt.sign(
    { role, email: user.email, id: user._id.toString() },
    secret,
    { expiresIn: "2h" }
  );

  setAdminCookie(res, token);

  return res.json({
    ok: true,
    admin: { email: user.email, id: user._id.toString(), role },
  });
});

export const me = asyncHandler(async (req, res) => {
  return res.json({
    ok: true,
    admin: { id: req.admin?.id, email: req.admin?.email, role: req.admin?.role },
  });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAdminCookie(res);
  return res.json({ ok: true });
});
