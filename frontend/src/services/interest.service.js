import api from "./api";

/**
 * Interest Service
 *
 * Provides API functions for matrimonial expression of interest (connection requests).
 */

/**
 * Fetches all interests sent by the authenticated user to other profiles.
 * @returns {Promise<AxiosResponse>} Array of sent interest objects
 */
export const getSentInterests = () => api.get("/interests/sent");

/**
 * Fetches all pending/received interests from other members.
 * @returns {Promise<AxiosResponse>} Array of received interest objects
 */
export const getReceivedInterests = () => api.get("/interests/received");

/**
 * Accepts a received interest request.
 * @param {string} id - The ID of the interest record
 * @returns {Promise<AxiosResponse>} Updated interest object with status 'ACCEPTED'
 */
export const acceptInterest = (id) => api.patch(`/interests/${id}/accept`);

/**
 * Rejects a received interest request.
 * @param {string} id - The ID of the interest record
 * @returns {Promise<AxiosResponse>} Updated interest object with status 'REJECTED'
 */
export const rejectInterest = (id) => api.patch(`/interests/${id}/reject`);

/**
 * Withdraws/cancels a previously sent interest request.
 * @param {string} id - The ID of the interest record
 * @returns {Promise<AxiosResponse>} Deletion confirmation response
 */
export const withdrawInterest = (id) => api.delete(`/interests/${id}`);

/**
 * Sends an expression of interest to another profile.
 * @param {string} profileId - ID of the target recipient's matrimonial profile
 * @returns {Promise<AxiosResponse>} Created interest object
 */
export const sendInterest = (profileId) => api.post(`/interests/${profileId}`);

