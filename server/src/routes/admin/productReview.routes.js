import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { requireAdminRole } from "../../middleware/requireAdminRole.js";
import { auditAdmin } from "../../middleware/auditAdmin.js";
import { listAdminProductReviews, patchAdminProductReview } from "../../controllers/admin/productReview.controller.js";

const router = Router();
router.use(requireAdmin);

router.get("/", listAdminProductReviews);
router.patch("/:id", requireAdminRole(["owner", "admin", "manager"]), auditAdmin("productReview.patch", { entityType: "productReview", entityId: (req) => req.params.id }), patchAdminProductReview);

export default router;
