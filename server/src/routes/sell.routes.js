import { Router } from "express";
import { createSellRequest, listMySellRequests } from "../controllers/sell.controller.js";
import upload, { setUploadFolder } from "../middleware/upload.js";
import authUser from "../middleware/authUser.js";

const router = Router();

/**
 * @route GET /api/v1/sell-requests/my
 * @desc Get logged-in user's sell requests (ownership safe)
 * @access Private (user)
 */
router.get("/my", authUser, listMySellRequests);

/**
 * @route POST /api/v1/sell-requests
 * @desc Create a new sell request with optional images
 * @access Private (user)
 */
router.post(
  "/",
  authUser,
  setUploadFolder("sell"),
  upload.array("images", 5),
  createSellRequest
);

export default router;
