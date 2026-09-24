import api from "./api";

/**
 * Matrimonial Profile Service
 *
 * Provides API client methods for managing personal profile data and profile photos.
 */

/**
 * Creates a new matrimonial profile for the authenticated user.
 * @param {object} data - Profile fields (names, gender, dob, religion, education, location, bio)
 * @returns {Promise<AxiosResponse>} Created profile object
 */
export const createProfile = (data) => {
  return api.post("/profile", data);
};

/**
 * Retrieves the authenticated user's own matrimonial profile.
 * @returns {Promise<AxiosResponse>} User profile object
 */
export const getProfile = () => {
  return api.get("/profile");
};

/**
 * Updates existing profile fields.
 * @param {object} data - Partial or full profile fields to update
 * @returns {Promise<AxiosResponse>} Updated profile object
 */
export const updateProfile = (data) => {
  return api.patch("/profile", data);
};

/**
 * Deletes the authenticated user's matrimonial profile.
 * @returns {Promise<AxiosResponse>} Deletion confirmation
 */
export const deleteProfile = () => {
  return api.delete("/profile");
};

/**
 * Uploads a profile picture using multipart/form-data.
 * @param {File} file - Image file to upload
 * @returns {Promise<AxiosResponse>} Response containing uploaded image URL
 */
export const uploadProfilePicture = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/upload/profile-picture", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Deletes the user's currently active profile picture.
 * @returns {Promise<AxiosResponse>} Deletion confirmation response
 */
export const deleteProfilePicture = () => {
  return api.delete("/upload/profile-picture");
};