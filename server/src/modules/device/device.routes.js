import express from "express";
import * as deviceController from "./device.controller.js";
import { deviceSchema, updateDeviceSchema } from "./device.validation.js";
import validate from "../../middleware/validate.js";
import upload, { setUploadFolder } from "../../middleware/upload.js";
import requireAdmin from "../../middleware/requireAdmin.js";
import optionalAuth from "../../middleware/optionalAuth.js";

const router = express.Router();

// Public routes
router.get("/", optionalAuth, deviceController.listDevices);
router.get("/:id", optionalAuth, deviceController.getDevice);
router.get("/:id/recommendations", deviceController.getRecommendations);

// Admin routes
const adminRouter = express.Router();
adminRouter.use(requireAdmin);

adminRouter.post(
  "/",
  setUploadFolder("devices"),
  upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "images", maxCount: 8 }]),
  validate(deviceSchema),
  deviceController.createDevice
);

adminRouter.patch(
  "/:id",
  setUploadFolder("devices"),
  upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "images", maxCount: 8 }]),
  validate(updateDeviceSchema),
  deviceController.updateDevice
);

adminRouter.delete("/:id", deviceController.deleteDevice);

export { router as deviceRoutes, adminRouter as adminDeviceRoutes };
