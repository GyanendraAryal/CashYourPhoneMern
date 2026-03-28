import express from "express";
import authUser from "../middleware/authUser.js";
import {
  createOrderFromCart,
  getMyOrders,
  getOrderById,
  cancelOrder
} from "../controllers/order.controller.js";

import validate from "../middleware/validate.js";
import { createOrderSchema } from "../validators/order.schema.js";

const router = express.Router();
router.use(authUser);

router.post("/from-cart", validate(createOrderSchema), createOrderFromCart);
router.get("/mine", getMyOrders);
router.get("/:id", getOrderById);
router.post("/:id/cancel", cancelOrder);

export default router;