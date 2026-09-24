import api from "./api";

/**
 * Safety & Trust Service
 *
 * Provides API client methods for user protection, blocking, and incident reporting.
 */

/**
 * Blocks a specific user to prevent them from seeing profile or sending messages/interests.
 * @param {string} userId - ID of the user to block
 * @returns {Promise<AxiosResponse>} Block confirmation
 */
export const blockUser = (userId) => api.post(`/safety/blocks/${userId}`);

/**
 * Unblocks a previously blocked user.
 * @param {string} userId - ID of the user to unblock
 * @returns {Promise<AxiosResponse>} Unblock confirmation
 */
export const unblockUser = (userId) => api.delete(`/safety/blocks/${userId}`);

/**
 * Fetches the list of all users blocked by the authenticated user.
 * @returns {Promise<AxiosResponse>} Array of blocked user records
 */
export const getBlockedUsers = () => api.get("/safety/blocks");

/**
 * Submits an abuse/harassment/fake profile report against a user.
 * @param {string} userId - ID of the reported user
 * @param {object} data - Report details (reason, description)
 * @returns {Promise<AxiosResponse>} Submitted report record
 */
export const reportUser = (userId, data) =>
  api.post(`/safety/reports/${userId}`, data);

