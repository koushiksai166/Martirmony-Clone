import axios from "axios";
import { getToken, removeToken } from "../utils/token";

/**
 * Axios HTTP Client Instance
 *
 * Configured with the backend API base URL and default JSON headers.
 * All outgoing service requests route through this instance.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request Interceptor
 *
 * Automatically attaches the active JWT authentication token
 * to the `Authorization` header of outgoing HTTP requests.
 */
api.interceptors.request.use((config) => {
  const token = getToken();

  // If a valid token exists in storage, attach as Bearer authorization
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Response Interceptor
 *
 * Handles global HTTP responses and error conditions:
 * - 2xx responses pass through untouched.
 * - 401 Unauthorized responses trigger session cleanup and redirect to login page.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns 401 Unauthorized, token has expired or is invalid
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;