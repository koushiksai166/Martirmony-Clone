import { createContext } from "react";

/**
 * AuthContext
 * 
 * React Context used to share authentication state across the component tree.
 * Provides user information, user profile data, session status (loading/authenticated),
 * and login/logout functions without prop drilling.
 */
export const AuthContext = createContext();

