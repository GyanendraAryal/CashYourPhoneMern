import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { requireAdminRole } from "../../middleware/requireAdminRole.js";
import { auditAdmin } from "../../middleware/auditAdmin.js";
import { list, create, update, remove, reorder } from "../../controllers/admin/faq.controller.js";

const router = Router();
router.use(requireAdmin);

router.get("/", list);
router.post("/", requireAdminRole(["owner", "admin", "manager"]), auditAdmin("faq.create", { entityType: "faq" }), create);
router.put("/:id", requireAdminRole(["owner", "admin", "manager"]), auditAdmin("faq.update", { entityType: "faq", entityId: (req) => req.params.id }), update);
router.delete("/:id", requireAdminRole(["owner", "admin"]), auditAdmin("faq.delete", { entityType: "faq", entityId: (req) => req.params.id }), remove);
router.patch("/reorder", requireAdminRole(["owner", "admin", "manager"]), auditAdmin("faq.reorder", { entityType: "faq" }), reorder);

export default router;
