import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, profile } = useAuth();
  const location = useLocation();

  // Wait until authentication check is complete
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-xl font-semibold">Loading...</h1>
      </div>
    );
  }

  // User is not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isProfileSetupRoute = [
    "/profile/create",
    "/profile/edit",
  ].includes(location.pathname);

  if (!profile && !isProfileSetupRoute) {
    return <Navigate to="/profile/create" replace />;
  }

  if (profile?.isProfileComplete && location.pathname === "/profile/create") {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated
  return children;
}

export default ProtectedRoute;