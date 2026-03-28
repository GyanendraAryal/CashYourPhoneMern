import bcrypt from "bcrypt";
import User from "../models/User.js";

function clearAuthCookies(res) {
  const isProd = process.env.NODE_ENV === "production";
  const common = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  };

  res.clearCookie("access_token", { ...common, path: "/" });
  res.clearCookie("refresh_token", { ...common, path: "/api/v1/auth/refresh" });
}

export async function me(req, res, next) {
  try {
    // authUser middleware sets: req.user = { id, role }
    const user = await User.findById(req.user.id).select("_id name email phone role createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

/**
 * @desc Change password for logged-in user
 * @route PATCH /api/v1/users/change-password
 * @access Private (user)
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Current password is incorrect" });

    // Prevent setting same password (small UX/safety win)
    const same = await bcrypt.compare(String(newPassword), user.passwordHash);
    if (same) {
      return res.status(400).json({ message: "New password must be different" });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 12);

    // Revoke all refresh tokens so all sessions are forced to log in again
    if (Array.isArray(user.refreshTokens)) {
      user.refreshTokens = user.refreshTokens.map((t) => ({
        ...t,
        revokedAt: t.revokedAt || new Date(),
      }));
    }

    await user.save();

    // Clear cookies to immediately log out this browser too
    clearAuthCookies(res);

    return res.json({ ok: true, message: "Password changed. Please log in again." });
  } catch (e) {
    next(e);
  }
}
