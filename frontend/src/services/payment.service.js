import api from "./api";

export const createPaymentOrder = () => api.post("/payments/orders");
export const getPaymentPlan = () => api.get("/payments/plan");
export const verifyPayment = (data) => api.post("/payments/verify", data);
export const getMembership = () => api.get("/payments/membership");
export const getPaymentHistory = () => api.get("/payments/history");
