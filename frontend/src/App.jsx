/**
 * ============================================================================
 * ROOT APPLICATION COMPONENT (App.jsx)
 * ============================================================================
 * The primary entry point for the React application's UI structure.
 * 
 * Responsibility:
 * - Delegates all routing logic to the AppRoutes component.
 * - This keeps the App component clean and focused solely on mounting the
 *   routing tree.
 * ============================================================================
 */

import AppRoutes from "./routes/AppRoutes";

function App() {
  // Render the routing configuration defined in AppRoutes
  return <AppRoutes />;
}

export default App;