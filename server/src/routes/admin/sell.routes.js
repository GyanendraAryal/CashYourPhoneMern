import { Router } from "express";
import requireAdmin from "../../middleware/requireAdmin.js";
import { requireAdminRole } from "../../middleware/requireAdminRole.js";
import { auditAdmin } from "../../middleware/auditAdmin.js";
import { list, getOne, updateStatus, remove } from "../../controllers/admin/sell.controller.js";

const router = Router();
router.use(requireAdmin);

router.get("/", requireAdminRole(["owner", "admin", "manager", "support", "fulfillment"]), list);
router.get("/:id", requireAdminRole(["owner", "admin", "manager", "support", "fulfillment"]), getOne);

router.patch(
  "/:id/status",
  requireAdminRole(["owner", "admin", "manager", "fulfillment"]),
  auditAdmin("sell.updateStatus", { entityType: "sellRequest", entityId: (req) => req.params.id }),
  updateStatus
);

router.delete(
  "/:id",
  requireAdminRole(["owner", "admin"]),
  auditAdmin("sell.delete", { entityType: "sellRequest", entityId: (req) => req.params.id }),
  remove
);

export default router;
