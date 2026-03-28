import express from "express";
import authUser from "../middleware/authUser.js";
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  mergeCart,
  clearCart,
  markSeen,
} from "../controllers/cart.controller.js";

const router = express.Router();

router.use(authUser);

router.get("/", getCart);
router.post("/items", addItem);
router.patch("/items/:id", updateItem);     // ✅ cart item id (fallback: deviceId for legacy)
router.delete("/items/:id", removeItem);    // ✅ cart item id (fallback: deviceId for legacy)
router.post("/merge", mergeCart);           // ✅ guest -> server merge
router.delete("/", clearCart);
router.post("/mark-seen", markSeen);

export default router;
