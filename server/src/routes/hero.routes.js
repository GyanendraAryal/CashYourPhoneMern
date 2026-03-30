import { Router } from "express";
import { cacheSeconds } from "../middleware/cache.js";
import { setUploadFolder } from "../middleware/upload.js";
import { list } from "../controllers/admin/hero.controller.js";

const router = Router();

// Public and mostly-static: cache briefly
router.use(setUploadFolder("hero"));
router.get("/", cacheSeconds(process.env.CACHE_TTL_HERO || 60), list);

export default router;
