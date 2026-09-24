import api from "./api";

/**
 * Authentication Service
 *
 * Provides API client functions for user authentication, registration, session checks, and password updates.
 */

/**
 * Registers a new user account with email/phone and password.
 * @param {object} data - Registration payload (email, phone, password, role)
 * @returns {Promise<AxiosResponse>} Server response with auth token and created user
 */
export const register = (data) =>
  api.post("/auth/register", data);

/**
 * Authenticates an existing user with credentials.
 * @param {object} data - Login credentials (email/phone and password)
 * @returns {Promise<AxiosResponse>} Auth token and user payload
 */
export const login = (data) =>
  api.post("/auth/login", data);

/**
 * Fetches the currently authenticated user's profile and account state using active token.
 * @returns {Promise<AxiosResponse>} Current user information
 */
export const getMe = () =>
  api.get("/auth/me");

/**
 * Changes password for the currently authenticated user.
 * @param {object} data - Password change payload (oldPassword, newPassword)
 * @returns {Promise<AxiosResponse>} Update status response
 */
export const changePassword = (data) =>
  api.patch("/auth/change-password", data);

/**
 * Refreshes an expired access token using a valid refresh token.
 * @param {string} refreshToken - The refresh token string
 * @returns {Promise<AxiosResponse>} New access token
 */
export const refreshSession = (refreshToken) =>
  api.post("/auth/refresh", { refreshToken });

/**
 * Terminates user session on the backend and blacklists the token.
 * @returns {Promise<AxiosResponse>} Logout confirmation response
 */
export const logoutSession = () => api.post("/auth/logout");