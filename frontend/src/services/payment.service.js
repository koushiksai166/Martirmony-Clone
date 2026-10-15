import api from "./api";

export const getPaymentPlans = () => api.get("/payments/plans");
export const createPaymentOrder = (plan) => api.post("/payments/orders", { plan });
export const verifyPayment = (data) => api.post("/payments/verify", data);
export const getMembership = () => api.get("/payments/membership");
export const getPaymentHistory = () => api.get("/payments/history");
export const retryPayment = (id) => api.post(`/payments/${id}/retry`);
export const refundPayment = (id, data) => api.post(`/payments/${id}/refund`, data);
export const getInvoice = (id) => api.get(`/payments/${id}/invoice`);
export const toggleAutoRenew = (enable) =>
  api.patch("/payments/membership/auto-renew", { enable });
