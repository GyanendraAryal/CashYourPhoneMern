import api from "../lib/api";

// Initiate eSewa payment
export function initiateEsewaPayment(orderId) {
  return api.post("/api/v1/payments/esewa/initiate", { orderId });
}

// Verify eSewa payment (redirect callback)
export function verifyEsewaPayment(data) {
  return api.get("/api/v1/payments/verify/esewa", {
    params: { data },
  });
}
