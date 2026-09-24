/**
 * ============================================================================
 * PROTECTED ROUTE WRAPPER
 * ============================================================================
 * Higher-Order Component (HOC) used in AppRoutes to secure private pages.
 * 
 * Logic Flow:
 * 1. Blocks rendering while authentication state is initializing (loading).
 * 2. Redirects unauthenticated users to `/login`.
 * 3. Enforces Profile Completion: 
 *    - If a user is logged in but hasn't created a profile, they are forcibly
 *      redirected to `/profile/create` for all routes EXCEPT profile setup routes.
 * 4. Prevents users with completed profiles from accessing `/profile/create`.
 * ============================================================================
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, profile } = useAuth();
  const location = useLocation();

  // 1. Wait until authentication check is complete (prevent flash of unauth state)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h1 className="text-xl font-semibold text-gray-600">Loading...</h1>
      </div>
    );
  }

  // 2. User is not logged in -> Redirect to login page
  if (!isAuthenticated) {
    // We use `replace` to prevent them from going "back" to a protected route
    return <Navigate to="/login" replace />;
  }

  // 3. Profile Completion Enforcement
  const isProfileSetupRoute = [
    "/profile/create",
    "/profile/edit",
  ].includes(location.pathname);

  // If no profile exists and they aren't already on a setup route, force them there
  if (!profile && !isProfileSetupRoute) {
    return <Navigate to="/profile/create" replace />;
  }

  // If profile is already complete, they shouldn't be able to access the creation wizard
  if (profile?.isProfileComplete && location.pathname === "/profile/create") {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and passes profile checks -> Render the requested page
  return children;
}

export default ProtectedRoute;