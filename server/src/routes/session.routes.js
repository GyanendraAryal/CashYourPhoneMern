import { Router } from "express";
import authUser from "../middleware/authUser.js";
import User from "../models/User.js";

const router = Router();

router.get("/", authUser, async (req, res) => {
  const user = await User.findById(req.user.id).select("refreshTokens");
  res.json({ sessions: user.refreshTokens || [] });
});

router.delete("/:tokenHash", authUser, async (req, res) => {
  await User.updateOne(
    { _id: req.user.id, "refreshTokens.tokenHash": req.params.tokenHash },
    { $set: { "refreshTokens.$.revokedAt": new Date() } }
  );
  res.json({ ok: true });
});

export default router;