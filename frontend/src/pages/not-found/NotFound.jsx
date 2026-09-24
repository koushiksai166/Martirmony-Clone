import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * NotFound (404) Page Component
 *
 * Catch-all wildcard route page shown when users navigate to a non-existent URL:
 * - Displays 404 graphic message and helpful guidance.
 * - Provides quick return link to the home / dashboard page.
 */
function NotFound() {
  return (
    <div className="app-page flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow text-[var(--rose)]">404 Error</p>
      <h1 className="display-font mt-3 text-5xl font-bold text-gray-800">
        Page Not Found
      </h1>
      <p className="mt-4 max-w-md text-base text-[var(--ink-soft)]">
        The page you are looking for doesn't exist, has been removed, or is
        temporarily unavailable.
      </p>
      <Link to="/" className="btn-primary mt-8 inline-flex items-center gap-2">
        <ArrowLeft size={17} /> Back to safety
      </Link>
    </div>
  );
}

export default NotFound;

