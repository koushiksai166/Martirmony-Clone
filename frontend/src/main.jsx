/**
 * ============================================================================
 * MAIN ENTRY POINT (main.jsx)
 * ============================================================================
 * Bootstraps the React application and mounts it to the DOM.
 * 
 * Providers Setup:
 * 1. React.StrictMode: Highlights potential problems during development.
 * 2. AuthProvider: Manages global authentication state (login, token, user context).
 * 3. ProfileProvider: Manages the authenticated user's profile data context.
 * 4. ToastContainer: Global toast notification renderer (from react-toastify).
 * ============================================================================
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Global CSS styles and Tailwind imports

// Context Providers
import AuthProvider from "./context/AuthContext";
import ProfileProvider from "./context/ProfileContext";

// Global Toast Notifications
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Global Authentication State */}
    <AuthProvider>
      {/* Global Profile State (depends on Auth state) */}
      <ProfileProvider>
        {/* Main Application Routes */}
        <App />
        
        {/* Global Toast Notification Container */}
        <ToastContainer position="top-right" autoClose={3000} />
      </ProfileProvider>
    </AuthProvider>
  </React.StrictMode>
);