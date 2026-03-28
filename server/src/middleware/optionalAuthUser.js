import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function optionalAuthUser(req, _res, next) {
  try {
    const token = req.cookies?.access_token || null;
    if (!token) {
      req.user = null;
      return next();
    }

    const secret =
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

    const payload = jwt.verify(token, secret);

    const userId = payload?.sub || payload?.id;
    if (!userId) {
      req.user = null;
      return next();
    }

    // Fetch fresh user data (don’t trust JWT blindly)
    const user = await User.findById(userId)
      .select("_id role email")
      .lean();

    if (!user) {
      req.user = null;
      return next();
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      email: user.email,
    };

    return next();
  } catch (err) {
    // Invalid / expired token → act as guest
    req.user = null;
    return next();
  }
}
