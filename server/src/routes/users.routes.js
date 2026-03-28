import { Router } from "express";
import authUser from "../middleware/authUser.js";
import { changePassword, me } from "../controllers/users.controller.js";

const router = Router();

router.get("/me", authUser, me);

// Change password (CSRF protected because it is a cookie-based user route)
router.patch("/change-password", authUser, changePassword);

export default router;
