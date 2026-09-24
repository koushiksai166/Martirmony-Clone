import { useEffect, useState } from "react";
import { getMe, logoutSession } from "../services/auth.service";
import { getProfile } from "../services/profile.service";
import { getToken, removeToken, setToken } from "../utils/token";
import { AuthContext } from "./AuthContext.context";

/**
 * AuthProvider Component
 *
 * Wraps application components and provides global authentication state and lifecycle methods:
 * - `user`: Currently authenticated user account details (ID, email, phone, role, verified status).
 * - `profile`: Matrimonial profile linked to the user (personal details, bio, photos, partner preferences).
 * - `loading`: Initial bootstrapping state to prevent UI flickers before token verification completes.
 * - `login`: Stores JWT token in storage and bootstraps authenticated user session.
 * - `logout`: Invalidates session on backend (if reachable) and purges local storage.
 * - `refreshProfile`: Re-fetches the latest profile data from the server.
 * - `clearProfile`: Clears local profile state.
 * - `isAuthenticated`: Boolean helper indicating if a valid user is logged in.
 */
function AuthProvider({ children }) {
  // Current user account object
  const [user, setUser] = useState(null);

  // User's matrimonial profile object
  const [profile, setProfile] = useState(null);

  // Loading flag while verifying JWT token on initial app load
  const [loading, setLoading] = useState(true);

  /**
   * checkAuth
   * Validates existing JWT token found in localStorage/cookies.
   * Fetches the current user account and matrimonial profile.
   * If token is invalid/expired, clears local session.
   */
  const checkAuth = async () => {
    const token = getToken();

    // If no token exists, the user is unauthenticated
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // 1. Validate token with backend /auth/me endpoint
      const response = await getMe();
      setUser(response.data.user);

      // 2. Attempt to fetch associated matrimonial profile
      try {
        const profileResponse = await getProfile();
        setProfile(profileResponse.data.profile ?? profileResponse.data);
      } catch (error) {
        // If 404 (Not Found), user has registered but hasn't created a matrimonial profile yet
        if (error.response?.status === 404) {
          setProfile(null);
        } else {
          throw error;
        }
      }
    } catch {
      // If token validation fails, clear stale credentials
      removeToken();
      setUser(null);
      setProfile(null);
    } finally {
      // Initialization complete
      setLoading(false);
    }
  };

  // Run token verification on initial mount
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * refreshProfile
   * Refreshes the matrimonial profile data from the backend API.
   * Useful after updating profile details, uploading photos, etc.
   */
  const refreshProfile = async () => {
    const response = await getProfile();
    const nextProfile = response.data.profile ?? response.data;
    setProfile(nextProfile);
    return nextProfile;
  };

  /**
   * clearProfile
   * Resets local profile state to null
   */
  const clearProfile = () => setProfile(null);

  /**
   * login
   * Handles user login by storing the received JWT token and refreshing auth state
   * @param {string} token - JWT authentication token from login/registration API
   */
  const login = async (token) => {
    setToken(token);
    await checkAuth();
  };

  /**
   * logout
   * Terminates active session on the backend and clears all local auth state and storage
   */
  const logout = async () => {
    try {
      if (getToken()) await logoutSession();
    } catch {
      // Local session cleanup still runs if the API is unavailable or returns an error.
    }
    removeToken();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        logout,
        refreshProfile,
        clearProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;

