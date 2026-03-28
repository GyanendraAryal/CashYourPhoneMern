import mongoose from "mongoose";
import * as orderService from "./order.service.js";

export const createOrderFromCart = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await orderService.createOrder(req.user.id, req.body.contact, session);
    await session.commitTransaction();
    res.status(201).json({
      status: "success",
      data: order
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getUserOrders(req.user.id);
    res.status(200).json({
      status: "success",
      results: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrder(req.params.id, req.user.id);
    res.status(200).json({
      status: "success",
      data: order
    });
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelUserOrder(req.params.id, req.user.id);
    res.status(200).json({
      status: "success",
      data: order
    });
  } catch (err) {
    next(err);
  }
};
