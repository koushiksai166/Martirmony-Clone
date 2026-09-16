import { createContext, useEffect, useState } from "react";
import { getMe, logoutSession } from "../services/auth.service";
import { getProfile } from "../services/profile.service";
import { getToken, removeToken, setToken } from "../utils/token";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await getMe();
      setUser(response.data.user);

      try {
        const profileResponse = await getProfile();
        setProfile(profileResponse.data.profile ?? profileResponse.data);
      } catch (error) {
        if (error.response?.status === 404) {
          setProfile(null);
        } else {
          throw error;
        }
      }
    } catch {
      removeToken();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication when app starts
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
  }, []);

  const refreshProfile = async () => {
    const response = await getProfile();
    const nextProfile = response.data.profile ?? response.data;
    setProfile(nextProfile);
    return nextProfile;
  };

  const clearProfile = () => setProfile(null);

  const login = async (token) => {
    setToken(token);
    await checkAuth();
  };

  const logout = async () => {
    try {
      if (getToken()) await logoutSession();
    } catch {
      // Local session cleanup still runs if the API is unavailable.
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