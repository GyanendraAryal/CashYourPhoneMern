import express from "express";
import requireAdmin from "../../middleware/requireAdmin.js";
import {
  listPayments,
  getPayment
} from "../../controllers/admin/payment.controller.js";

const router = express.Router();
router.use(requireAdmin);

router.get("/", listPayments);
router.get("/:id", getPayment);

export default router;