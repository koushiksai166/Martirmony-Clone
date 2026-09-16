import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function DashboardLayout({ children }) {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full bg-pink-600 p-5 text-white md:w-64">
        <h1 className="text-2xl font-bold">
          Matrimony
        </h1>

        <ul className="mt-6 flex flex-wrap gap-4 md:mt-10 md:block md:space-y-4">
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/profile">My Profile</Link></li>
          <li><Link to="/preferences">Partner Preference</Link></li>
          <li><Link to="/search">Search</Link></li>
          <li><Link to="/matches">Matches</Link></li>
          <li><Link to="/interests">Interests</Link></li>
          <li><Link to="/messages">Messages</Link></li>
          <li><Link to="/notifications">Notifications</Link></li>
          <li><button type="button" onClick={logout}>Logout</button></li>
        </ul>
      </aside>

      {/* Main */}
      <div className="flex-1">
        <header className="bg-white shadow p-5">
          Welcome User 👋
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;