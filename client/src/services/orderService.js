import api from "../lib/api";

const BASE = "/api/v1/orders";

/** Backend wraps entities as { status: "success", data: ... } */
function unwrapData(body) {
  if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
    return body.data;
  }
  return body;
}

/**
 * Creates an order from the current cart.
 * @param {Object} contact
 */
export const createOrderFromCart = (contact) =>
  api.post(`${BASE}/from-cart`, contact ? { contact } : {}).then((r) => unwrapData(r.data));

export const getMyOrders = () =>
  api.get(`${BASE}/mine`).then((r) => unwrapData(r.data));

/**
 * @param {string} id
 * @param {import("axios").AxiosRequestConfig} [config] e.g. `{ signal }` for AbortController
 */
export const getOrder = (id, config) =>
  api.get(`${BASE}/${id}`, config).then((r) => unwrapData(r.data));

export const cancelOrder = (id) =>
  api.post(`${BASE}/${id}/cancel`).then((r) => unwrapData(r.data));
