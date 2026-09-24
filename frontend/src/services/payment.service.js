import api from "./api";

/**
 * Payment & Subscription Service
 *
 * Provides API client functions for Razorpay payment processing and membership subscriptions.
 */

/**
 * Creates a Razorpay payment order for purchasing a premium membership.
 * @returns {Promise<AxiosResponse>} Order details including orderId, amount, currency, keyId
 */
export const createPaymentOrder = () => api.post("/payments/orders");

/**
 * Retrieves pricing and features of available premium subscription plans.
 * @returns {Promise<AxiosResponse>} Plan information
 */
export const getPaymentPlan = () => api.get("/payments/plan");

/**
 * Verifies Razorpay payment signature and activates the premium subscription.
 * @param {object} data - Signature payload (razorpay_order_id, razorpay_payment_id, razorpay_signature)
 * @returns {Promise<AxiosResponse>} Verification confirmation and updated subscription
 */
export const verifyPayment = (data) => api.post("/payments/verify", data);

/**
 * Fetches current user's membership status and subscription validity.
 * @returns {Promise<AxiosResponse>} Membership status and expiration date
 */
export const getMembership = () => api.get("/payments/membership");

/**
 * Retrieves user's transaction/payment history logs.
 * @returns {Promise<AxiosResponse>} List of historical transactions
 */
export const getPaymentHistory = () => api.get("/payments/history");

