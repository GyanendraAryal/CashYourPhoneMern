import express from "express";
import authUser from "../middleware/authUser.js";
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  markSeen,
  syncPrices,
} from "../controllers/cart.controller.js";

const router = express.Router();

// All cart routes require a valid authenticated session
router.use(authUser);

router.get("/", getCart);
router.post("/items", addItem);
router.patch("/items/:id", updateItem);  // cart item _id (fallback: deviceId for legacy)
router.delete("/items/:id", removeItem); // cart item _id (fallback: deviceId for legacy)
// NOTE: /merge route removed — guest cart system decommissioned
router.delete("/", clearCart);
router.post("/mark-seen", markSeen);
router.post("/sync-prices", syncPrices);

export default router;
