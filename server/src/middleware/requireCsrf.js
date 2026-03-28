export function requireCsrf(req, res, next) {
  try {
    const method = req.method.toUpperCase();
    const unsafe = ["POST", "PUT", "PATCH", "DELETE"];

    if (!unsafe.includes(method)) return next();

    const cookieToken = req.cookies?.csrf_token;
    const headerToken = req.get("x-csrf-token");

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return res.status(403).json({ message: "CSRF token missing or invalid" });
    }

    return next();
  } catch (e) {
    return res.status(403).json({ message: "CSRF check failed" });
  }
}
