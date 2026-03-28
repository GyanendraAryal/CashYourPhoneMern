import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { requireAdminRole } from "../../middleware/requireAdminRole.js";
import { auditAdmin } from "../../middleware/auditAdmin.js";
import { uploadAdmin } from "../../middleware/adminMulter.js";
import { uploadSingle, uploadMany } from "../../controllers/admin/upload.controller.js";

const router = Router();

// 🔒 Admin only
router.use(requireAdmin);

// CMS uploads → /uploads/admin
router.post("/single", requireAdminRole(["owner", "admin", "manager"]), auditAdmin("upload.single", { entityType: "upload" }), uploadAdmin.single("file"), uploadSingle);
router.post("/many", requireAdminRole(["owner", "admin", "manager"]), auditAdmin("upload.many", { entityType: "upload" }), uploadAdmin.array("files", 10), uploadMany);

export default router;