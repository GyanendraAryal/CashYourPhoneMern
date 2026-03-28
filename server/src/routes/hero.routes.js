import { Router } from "express";
import { listHeroSlides } from "../controllers/hero.controller.js";
import { cacheSeconds } from "../middleware/cache.js";

const router = Router();

// Public and mostly-static: cache briefly
router.get("/", cacheSeconds(process.env.CACHE_TTL_HERO || 60), listHeroSlides);

export default router;
