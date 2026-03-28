import { Router } from "express";
import { listDevices, getDevice } from "../controllers/device.controller.js";
import { validateDeviceQuery } from "../middleware/validateQuery.js";
import optionalAuthUser from "../middleware/optionalAuthUser.js";

const router = Router();

/**
 * @route GET /api/v1/devices
 * @desc Fetch a paginated list of devices
 * @query
 *   - condition: string (optional)
 *   - featured: boolean (optional)
 *   - page: number (optional)
 *   - limit: number (optional)
 *   - sort: string (optional)
 */
router.get("/", optionalAuthUser, validateDeviceQuery, listDevices);

/**
 * @route GET /api/v1/devices/:id
 * @desc Fetch a single device by its MongoDB ObjectId
 */
router.get("/:id", optionalAuthUser, getDevice);

export default router;
