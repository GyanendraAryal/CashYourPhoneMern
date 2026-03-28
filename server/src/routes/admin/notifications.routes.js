import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { listNotifications, summary, markRead, markReadBulk, markAllRead, markReadByType } from "../../controllers/admin/notifications.controller.js";

const router = Router();
router.use(requireAdmin);

router.get("/", listNotifications);
router.get("/summary", summary);
router.post("/read", markReadBulk);
router.post("/:id/read", markRead);
router.post("/read-all", markAllRead);
router.post("/read-by-type", markReadByType);

export default router;