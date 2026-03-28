import express from "express";
import requireAdmin from "../../middleware/requireAdmin.js";
import { requireAdminRole } from "../../middleware/requireAdminRole.js";
import { auditAdmin } from "../../middleware/auditAdmin.js";
import { listOrders, getOrder, updateOrderStatus } from "../../controllers/admin/order.controller.js";

const router = express.Router();
router.use(requireAdmin);

router.get("/", requireAdminRole(["owner", "admin", "manager", "support", "fulfillment"]), listOrders);
router.get("/:id", requireAdminRole(["owner", "admin", "manager", "support", "fulfillment"]), getOrder);

router.patch(
  "/:id/status",
  requireAdminRole(["owner", "admin", "manager", "fulfillment"]),
  auditAdmin("order.updateStatus", { entityType: "order", entityId: (req) => req.params.id }),
  updateOrderStatus
);

export default router;
