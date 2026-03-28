/**
 * Phase 3: Role-based access control for admin routes.
 *
 * Usage:
 *   router.patch("/something", requireAdmin, requireAdminRole(["owner","admin"]), handler)
 */
export function requireAdminRole(allowedRoles = []) {
  const allowed = new Set((allowedRoles || []).map((r) => String(r).toLowerCase().trim()));

  return (req, res, next) => {
    const role = String(req.admin?.role || "").toLowerCase().trim();

    if (!role) {
      return res.status(403).json({ error: true, message: "Forbidden" });
    }

    // If allowedRoles not provided, treat as "any authenticated admin"
    if (allowed.size === 0) return next();

    if (!allowed.has(role)) {
      return res.status(403).json({
        error: true,
        message: "Forbidden - insufficient role permissions",
      });
    }

    return next();
  };
}

export default requireAdminRole;
