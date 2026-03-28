import express from "express";
import * as pricingController from "./pricing.controller.js";
import validate from "../../middleware/validate.js";
import { estimateSchema } from "./pricing.validation.js";
import * as adminPricingController from "../../controllers/admin/pricing.controller.js";

const router = express.Router();

router.get("/config", adminPricingController.getPricingConfig);
router.post("/estimate", validate(estimateSchema), pricingController.getEstimate);

export default router;
