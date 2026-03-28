import { Router } from "express";
import requireAdmin from "../../middleware/requireAdmin.js";
import { requireAdminRole } from "../../middleware/requireAdminRole.js";
import { getUserById, listUsers } from "../../controllers/admin/users.controller.js";

const router = Router();

// Protected: list users
router.get("/", requireAdmin, requireAdminRole(["owner", "admin", "manager", "support"]), listUsers);

// Protected: user detail
router.get("/:id", requireAdmin, requireAdminRole(["owner", "admin", "manager", "support"]), getUserById);

export default router;
