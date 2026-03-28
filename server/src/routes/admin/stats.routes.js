import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { getStats } from "../../controllers/admin/stats.controller.js";

const router = Router();
router.use(requireAdmin);

router.get("/", getStats);

export default router;
