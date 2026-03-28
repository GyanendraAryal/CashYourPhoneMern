import { Router } from "express";
import requireAdmin from "../../middleware/requireAdmin.js";
import { requireAdminRole } from "../../middleware/requireAdminRole.js";
import { listAuditLogs } from "../../controllers/admin/audit.controller.js";
//import {requireCsrf} from "../../middleware/requireCsrf.js";


const router = Router();

// Read-only: allow roles that can operate support/ops
router.get("/", requireAdmin, requireAdminRole(["owner", "admin", "manager", "support"]), listAuditLogs);

export default router;
