import { Router } from "express";
import requireAdmin from "../../middleware/requireAdmin.js";
import { requireAdminRole } from "../../middleware/requireAdminRole.js";
import { auditAdmin } from "../../middleware/auditAdmin.js";
import { uploadAdmin } from "../../middleware/adminMulter.js";
import { list, getOne, create, update, remove } from "../../controllers/admin/review.controller.js";

const router = Router();
router.use(requireAdmin);

router.get("/", requireAdminRole(["owner", "admin", "manager", "support"]), list);
router.get("/:id", requireAdminRole(["owner", "admin", "manager", "support"]), getOne);

router.post(
  "/",
  requireAdminRole(["owner", "admin", "manager"]),
  auditAdmin("review.create", { entityType: "review" }),
  uploadAdmin.single("avatar"),
  create
);

router.patch(
  "/:id",
  requireAdminRole(["owner", "admin", "manager"]),
  auditAdmin("review.update", { entityType: "review", entityId: (req) => req.params.id }),
  uploadAdmin.single("avatar"),
  update
);

router.delete(
  "/:id",
  requireAdminRole(["owner", "admin"]),
  auditAdmin("review.delete", { entityType: "review", entityId: (req) => req.params.id }),
  remove
);

export default router;
