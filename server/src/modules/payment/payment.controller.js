import * as paymentService from "./payment.service.js";
import AppError from "../../utils/AppError.js";

export const initiateEsewa = async (req, res, next) => {
  try {
    const result = await paymentService.initiateEsewaPayment(req.body.orderId, req.user.id);
    res.status(200).json({ status: "success", ...result });
  } catch (err) {
    next(err);
  }
};

export const esewaSuccess = async (req, res, next) => {
  const clientReturnUrl = paymentService.getClientAppUrl();
  try {
    const data = req.query.data || req.body.data;
    if (!data) {
      return res.redirect(
        `${clientReturnUrl}/checkout?payment=failed&message=${encodeURIComponent("Missing payment response from eSewa")}`
      );
    }
    res.redirect(`${clientReturnUrl}/payment/success?data=${encodeURIComponent(data)}`);
  } catch (err) {
    res.redirect(
      `${clientReturnUrl}/checkout?payment=failed&message=${encodeURIComponent(err.message)}`
    );
  }
};

export const verifyEsewa = async (req, res, next) => {
  try {
    const data = req.query.data;
    if (!data) throw new AppError("Missing payment data", 400);

    const payment = await paymentService.verifyEsewaPayment(data);
    res.status(200).json({
      status: "success",
      orderId: payment.order?._id || payment.order,
      paymentId: payment._id
    });
  } catch (err) {
    next(err);
  }
};

export const esewaFailure = async (req, res, next) => {
  try {
    const data = req.query.data || req.body?.data;
    const { clientReturnUrl } = await paymentService.handleEsewaFailure(data);
    res.redirect(`${clientReturnUrl}/checkout?payment=failed`);
  } catch (err) {
    next(err);
  }
};
