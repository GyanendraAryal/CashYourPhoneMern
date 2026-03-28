// Hardened Order Service
import Order from "../models/order.model.js";
import { calculatePrice } from "./ml.service.js";

export const createOrder = async (userId, deviceData, clientPrice) => {
  const serverPrice = calculatePrice(deviceData);

  if (serverPrice !== clientPrice) {
    throw new Error("Price tampering detected");
  }

  return await Order.create({
    user: userId,
    device: deviceData,
    price: serverPrice,
    status: "pending",
  });
};
