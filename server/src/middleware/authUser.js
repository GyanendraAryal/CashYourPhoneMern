import jwt from "jsonwebtoken";
import User from "../models/User.js"; // 🔴 REQUIRED

const getAccessSecret = () =>
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

export default async function authUser(req, res, next) {
  try {
    if (process.env.AUTH_DEBUG === "true") {
      const keys = Object.keys(req.cookies || {});
      console.log(`[authUser] ${req.method} ${req.originalUrl} cookies:`, keys);
    }

    const bearer = req.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice("Bearer ".length).trim()
      : null;

    const token =
      req.cookies?.access_token ||
      req.cookies?.accessToken ||
      bearer;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const secret = getAccessSecret();
    if (!secret) {
      return res.status(500).json({
        message: "Server misconfiguration (JWT secret missing)",
      });
    }

    const decoded = jwt.verify(token, secret);

    // 🔥 CRITICAL: Fetch user from DB (DO NOT trust token blindly)
    const user = await User.findById(decoded.sub).select("_id role isActive");

    if (!user || user.isActive === false) {
      return res.status(401).json({ message: "User not valid" });
    }

    // ✅ attach trusted user
    req.user = {
      id: user._id,
      role: user.role,
    };

    return next();

  } catch (err) {
    return res.status(401).json({
      message:
        err?.name === "TokenExpiredError"
          ? "Token expired"
          : "Invalid token",
    });
  }
}