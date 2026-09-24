import api from "./api";

/**
 * Search & Discovery Service
 *
 * Provides API client methods for searching member profiles and viewing public profile pages.
 */

/**
 * Searches and filters matrimonial profiles based on query parameters
 * (age range, religion, caste, education, occupation, location, pagination).
 * @param {object} params - Query filters for search
 * @returns {Promise<AxiosResponse>} Search results containing matching profiles
 */
export const searchProfiles = (params) => api.get("/profile/search", { params });

/**
 * Retrieves full public profile details of a member by profile ID.
 * @param {string} id - The ID of the matrimonial profile to view
 * @returns {Promise<AxiosResponse>} Public profile details
 */
export const getPublicProfile = (id) => api.get(`/profile/${id}`);

