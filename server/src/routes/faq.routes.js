import { Router } from "express";
import { listActiveFaqs } from "../controllers/faq.controller.js";
import { cacheSeconds } from "../middleware/cache.js";

const router = Router();

// Public and mostly-static: cache briefly
router.get("/", cacheSeconds(process.env.CACHE_TTL_FAQ || 120), listActiveFaqs);

export default router;
