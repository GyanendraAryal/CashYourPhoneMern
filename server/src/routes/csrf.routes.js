import { Router } from "express";
import crypto from "crypto";

const router = Router();

router.get("/", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";

  const token = crypto.randomBytes(32).toString("hex");

  // Non-HttpOnly so frontend JS can read it if needed (or just mirror it)
  res.cookie("csrf_token", token, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  });

  res.json({ csrfToken: token });
});

export default router;
