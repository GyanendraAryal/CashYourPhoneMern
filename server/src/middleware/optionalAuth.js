import jwt from "jsonwebtoken";

/**
 * Optional authentication middleware.
 * If a valid token is present, it sets req.user.
 * If no token or invalid token, it simply proceeds to next() without error.
 */
export default function optionalAuth(req, res, next) {
  try {
    const bearer = req.headers?.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice("Bearer ".length).trim()
      : null;

    const token = req.cookies?.access_token || req.cookies?.accessToken || bearer;

    if (!token) return next();

    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!secret) return next();

    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.sub, role: decoded.role };
    next();
  } catch (err) {
    // Silently fail authentication for optional routes
    next();
  }
}
