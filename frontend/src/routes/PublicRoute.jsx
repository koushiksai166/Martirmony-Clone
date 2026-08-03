import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Wait until authentication check is complete
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-xl font-semibold">Loading...</h1>
      </div>
    );
  }

  // Already logged in
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default PublicRoute;