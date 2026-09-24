/**
 * ============================================================================
 * APP ROUTES CONFIGURATION (AppRoutes.jsx)
 * ============================================================================
 * Defines the React Router DOM hierarchy for the entire application.
 *
 * Route Types:
 * 1. Public Routes: Accessible to anyone (e.g., Home).
 * 2. Auth-Restricted (<PublicRoute>): Accessible ONLY to unauthenticated users 
 *    (e.g., Login, Register). Redirects to /dashboard if already logged in.
 * 3. Protected (<ProtectedRoute>): Accessible ONLY to authenticated users.
 *    Redirects to /login if the user is not authenticated.
 * ============================================================================
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/home/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Dashboard from "../pages/dashboard/Dashboard";
import CreateProfile from "../pages/profile/CreateProfile";
import EditProfile from "../pages/profile/EditProfile";
import MyProfile from "../pages/profile/MyProfile";
import NotFound from "../pages/not-found/NotFound";
import Preferences from "../pages/preferences/Preferences";
import Search from "../pages/search/Search";
import PublicProfile from "../pages/profile/PublicProfile";
import Matches from "../pages/matches/Matches";
import Interests from "../pages/interests/Interests";
import Messages from "../pages/messages/Messages";
import Notifications from "../pages/notifications/Notifications";
import Admin from "../pages/admin/Admin";
import Membership from "../pages/membership/Membership";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ======================= */}
        {/* PUBLIC & UN-AUTH ROUTES */}
        {/* ======================= */}
        <Route path="/" element={<Home />} />

        {/* Login/Register use PublicRoute to prevent logged-in users from seeing them */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* ======================= */}
        {/* PROTECTED ROUTES        */}
        {/* ======================= */}
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Profile Management */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/create"
          element={
            <ProtectedRoute>
              <CreateProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        {/* Settings & Discovery */}
        <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
        
        {/* Interactions */}
        <Route path="/interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        
        {/* Administration & Billing */}
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/membership" element={<ProtectedRoute><Membership /></ProtectedRoute>} />
        
        {/* Public Profile View (Requires auth to view others) */}
        <Route path="/profile/:id" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />

        {/* Fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;