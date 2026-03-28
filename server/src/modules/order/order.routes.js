import express from "express";
import * as orderController from "./order.controller.js";
import authUser from "../../middleware/authUser.js";
import validate from "../../middleware/validate.js";
import { createOrderSchema } from "./order.validation.js";

const router = express.Router();
router.use(authUser);

router.post("/from-cart", validate(createOrderSchema), orderController.createOrderFromCart);
router.get("/mine", orderController.getMyOrders);
router.get("/:id", orderController.getOrderById);
router.post("/:id/cancel", orderController.cancelOrder);

export default router;
