import api from "./api";

/**
 * Admin Service
 *
 * Provides API functions for administrative moderation and user management.
 */

/**
 * Fetches all registered users with their account status and roles.
 * @returns {Promise<AxiosResponse>} Array of user objects
 */
export const getAdminUsers = () => api.get("/admin/users");

/**
 * Fetches matrimonial profiles that are pending administrative verification/approval.
 * @returns {Promise<AxiosResponse>} List of pending profiles
 */
export const getPendingProfiles = () => api.get("/admin/profiles/pending");

/**
 * Verifies and approves a matrimonial profile.
 * @param {string} id - The ID of the profile to verify
 * @returns {Promise<AxiosResponse>} Updated profile object
 */
export const verifyProfile = (id) => api.patch(`/admin/profiles/${id}/verify`);

/**
 * Fetches all user-submitted safety/abuse reports.
 * @returns {Promise<AxiosResponse>} Array of reported incidents
 */
export const getReports = () => api.get("/admin/reports");

/**
 * Marks a safety/moderation report as resolved.
 * @param {string} id - The ID of the report to resolve
 * @returns {Promise<AxiosResponse>} Resolution confirmation
 */
export const resolveReport = (id) => api.patch(`/admin/reports/${id}/resolve`);

/**
 * Deletes a user account and associated profile data by user ID.
 * @param {string} id - The ID of the user to delete
 * @returns {Promise<AxiosResponse>} Deletion confirmation
 */
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

