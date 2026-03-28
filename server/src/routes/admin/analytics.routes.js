import express from "express";
import * as analyticsController from "../../controllers/admin/analytics.controller.js";
import requireAdmin from "../../middleware/requireAdmin.js";

const router = express.Router();

router.use(requireAdmin);

router.get("/dashboard", analyticsController.getFullAnalytics);

export default router;
