/**
 * Token Management Utilities
 *
 * Provides helper functions for reading, storing, and removing JWT auth tokens
 * in browser's localStorage.
 */

// Storage key for JWT token
const TOKEN_KEY = "access_token";

/**
 * Retrieves the stored JWT authentication token from localStorage
 * @returns {string|null} The auth token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Persists a new JWT authentication token to localStorage
 * @param {string} token - The JWT string received upon login/signup
 */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Deletes the stored JWT authentication token from localStorage (logout)
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Checks whether an authentication token currently exists in localStorage
 * @returns {boolean} True if token exists, false otherwise
 */
export const hasToken = () => {
  return !!localStorage.getItem(TOKEN_KEY);
};