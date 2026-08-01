function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-pink-600 text-white p-5">
        <h1 className="text-2xl font-bold">
          Matrimony
        </h1>

        <ul className="mt-10 space-y-4">
          <li>Dashboard</li>
          <li>My Profile</li>
          <li>Partner Preference</li>
          <li>Matches</li>
          <li>Logout</li>
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