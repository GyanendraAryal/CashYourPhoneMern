import { Router } from "express";
import { listReviews, createReview } from "../controllers/review.controller.js";
import upload, { setUploadFolder } from "../middleware/upload.js";
import { reviewCreateLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import { createReviewSchema } from "../validators/review.validator.js";

const router = Router();

router.get("/", listReviews);

// Accept multipart/form-data with avatar file
router.post(
  "/",
  reviewCreateLimiter,
  setUploadFolder("reviews"),
  upload.single("avatar"),
  validate(createReviewSchema),
  createReview
);

export default router;
