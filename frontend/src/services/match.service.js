import api from "./api";

/**
 * Match Service
 *
 * Provides API functions for retrieving algorithmic partner recommendations.
 */

/**
 * Fetches recommended matrimonial matches based on the user's partner preferences,
 * age range, location, religion, mother tongue, and mutual compatibility.
 * @returns {Promise<AxiosResponse>} List of matched profiles with compatibility scores
 */
export const getMatches = () => api.get("/matches");

