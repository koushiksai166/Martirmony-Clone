import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.context";

/**
 * useAuth Hook
 *
 * Custom React hook that provides direct access to the global AuthContext.
 * Returns authentication state (`user`, `profile`, `loading`, `isAuthenticated`)
 * and action methods (`login`, `logout`, `refreshProfile`, `clearProfile`).
 *
 * @returns {object} The authentication context value
 */
export const useAuth = () => {
  return useContext(AuthContext);
};