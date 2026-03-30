import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { requireAdminRole } from "../../middleware/requireAdminRole.js";
import { auditAdmin } from "../../middleware/auditAdmin.js";
import { uploadAdmin } from "../../middleware/adminMulter.js";
import { setUploadFolder } from "../../middleware/upload.js";
import {
  listAdmin,
  getOne,
  create,
  update,
  remove,
} from "../../controllers/admin/hero.controller.js";

const router = Router();

router.use(requireAdmin);
router.use(setUploadFolder("hero"));

router.get("/", listAdmin);
router.get("/:id", getOne);

/**
 * Accept responsive images:
 * - imageDesktop (required for new slides)
 * - imageMobile (optional)
 * - image (legacy fallback)
 */
const heroUpload = uploadAdmin.fields([
  { name: "imageDesktop", maxCount: 1 },
  { name: "imageMobile", maxCount: 1 },
  { name: "image", maxCount: 1 }, // legacy support
]);

router.post("/", requireAdminRole(["owner", "admin", "manager"]), auditAdmin("hero.create", { entityType: "hero" }), heroUpload, create);
router.patch("/:id", requireAdminRole(["owner", "admin", "manager"]), auditAdmin("hero.update", { entityType: "hero", entityId: (req) => req.params.id }), heroUpload, update);

router.delete("/:id", requireAdminRole(["owner", "admin"]), auditAdmin("hero.delete", { entityType: "hero", entityId: (req) => req.params.id }), remove);

export default router;
