import express from "express";
import * as pricingController from "../../controllers/admin/pricing.controller.js";
import requireAdmin from "../../middleware/requireAdmin.js";

const router = express.Router();

router.use(requireAdmin);

router.get("/config", pricingController.getPricingConfig);
router.patch("/config", pricingController.updatePricingConfig);

export default router;
