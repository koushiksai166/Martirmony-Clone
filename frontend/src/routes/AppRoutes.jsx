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
        {/* Public */}
        <Route path="/" element={<Home />} />

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

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

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

        <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
        <Route path="/interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/membership" element={<ProtectedRoute><Membership /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;