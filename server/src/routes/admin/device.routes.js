import { Router } from "express";
import requireAdmin from "../../middleware/requireAdmin.js";
import { requireAdminRole } from "../../middleware/requireAdminRole.js";
import { auditAdmin } from "../../middleware/auditAdmin.js";
import { uploadAdmin } from "../../middleware/adminMulter.js";
import { list, getOne, create, update, remove } from "../../controllers/admin/device.controller.js";
import validate from "../../middleware/validate.js";
import { deviceSchema, updateDeviceSchema } from "../../validators/device.schema.js";

const router = Router();

router.use(requireAdmin);

router.get("/", list);
router.get("/:id", getOne);

// CREATE device (thumbnail + multiple images)
router.post(
  "/",
  requireAdminRole(["owner", "admin", "manager"]),
  auditAdmin("device.create", { entityType: "device" }),
  uploadAdmin.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 8 },
  ]),
  validate(deviceSchema),
  create
);

// UPDATE device
router.put(
  "/:id",
  requireAdminRole(["owner", "admin", "manager"]),
  auditAdmin("device.update", { entityType: "device", entityId: (req) => req.params.id }),
  uploadAdmin.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 8 },
  ]),
  validate(updateDeviceSchema),
  update
);

router.delete(
  "/:id",
  requireAdminRole(["owner", "admin"]),
  auditAdmin("device.delete", { entityType: "device", entityId: (req) => req.params.id }),
  remove
);

export default router;
