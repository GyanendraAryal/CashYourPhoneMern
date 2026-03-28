import { Router } from "express";
import authUser from "../middleware/authUser.js";
import { createProductReview, listProductReviews } from "../controllers/productReview.controller.js";

const router = Router();

// Public list (approved by default)
router.get("/", listProductReviews);

// Auth submit
router.post("/", authUser, createProductReview);

export default router;
