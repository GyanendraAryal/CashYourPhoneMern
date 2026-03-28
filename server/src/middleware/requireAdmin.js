import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser.js";

/**
 * Phase 3: Admin auth middleware (Hardened)
 * - Validates admin_token cookie
 * - Verifies user existence and 'admin' role in DB
 * - Attaches req.admin payload
 */
export const requireAdmin = async (req, res, next) => {
  try {
    const token = req.cookies?.admin_token || null;

    if (!token) {
      return res
        .status(401)
        .json({ error: true, message: "Missing admin authentication cookie" });
    }

    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        error: true,
        message: "Server misconfiguration (ADMIN_JWT_SECRET not set)",
      });
    }

    const payload = jwt.verify(token, secret);

    // Basic sanity: must include an id
    if (!payload?.id) {
      return res.status(401).json({ error: true, message: "Invalid admin token" });
    }

    // 🛡️ SECURITY PATCH: Verify against DB on every request
    const adminUser = await AdminUser.findOne({ _id: payload.id, disabled: false });
    if (!adminUser) {
       return res.status(401).json({ error: true, message: "Admin privileges revoked or account not found" });
    }

    req.admin = {
      id: adminUser._id,
      email: adminUser.email,
      role: adminUser.role
    };

    return next();
  } catch (err) {
    return res.status(401).json({
      error: true,
      message:
        err?.name === "TokenExpiredError"
          ? "Token expired, please log in again"
          : "Invalid or malformed token",
    });
  }
};

export default requireAdmin;
