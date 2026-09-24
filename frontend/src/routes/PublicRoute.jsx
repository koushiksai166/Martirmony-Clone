/**
 * ============================================================================
 * PUBLIC (GUEST) ROUTE WRAPPER
 * ============================================================================
 * Higher-Order Component (HOC) used for routes that should ONLY be visible
 * to users who are NOT logged in (e.g., Login and Register pages).
 * 
 * Logic Flow:
 * 1. Blocks rendering while authentication state is initializing (loading).
 * 2. If the user is already authenticated, redirects them away to `/dashboard`.
 * 3. Otherwise, allows access to the public route.
 * ============================================================================
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Wait until authentication check is complete
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <h1 className="text-xl font-semibold text-gray-600">Loading...</h1>
      </div>
    );
  }

  // If already logged in, they don't need to see the Login/Register pages
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicRoute;