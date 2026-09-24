import api from "./api";

/**
 * Partner Preferences Service
 *
 * Provides API client functions for fetching and updating partner matching criteria
 * (age range, religion, education, occupation, income, location).
 */

/**
 * Retrieves the currently saved partner preferences for the logged-in user.
 * @returns {Promise<AxiosResponse>} Partner preferences object
 */
export const getPreferences = () => api.get("/preferences");

/**
 * Updates or creates the user's desired partner preferences.
 * @param {object} data - Partner preference criteria payload
 * @returns {Promise<AxiosResponse>} Updated partner preferences object
 */
export const savePreferences = (data) => api.patch("/preferences", data);

