import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  deleteUser,
  getAdminUsers,
  getPendingProfiles,
  getReports,
  resolveReport,
  verifyProfile,
} from "../../services/admin.service";

/**
 * Admin Dashboard Page Component
 *
 * Administrative moderation dashboard providing three core management sections:
 * 1. Pending Profiles: Profiles awaiting manual verification and approval.
 * 2. Incident Reports: Safety/abuse reports filed by members.
 * 3. Registered Users: Account directory with capability to delete offending users.
 */
function Admin() {
  // State variables for admin data collections
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches all admin data concurrently via Promise.all
   */
  const load = async () => {
    try {
      const [usersResponse, profilesResponse, reportsResponse] =
        await Promise.all([
          getAdminUsers(),
          getPendingProfiles(),
          getReports(),
        ]);
      setUsers(usersResponse.data);
      setProfiles(profilesResponse.data);
      setReports(reportsResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load admin data");
    } finally {
      setLoading(false);
    }
  };

  // Load admin data on mount
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    load();
  }, []);

  /**
   * Helper wrapper to execute an admin action, reload data, and show toast feedback
   * @param {Function} request - Async admin service API call
   * @param {string} message - Success notification message
   */
  const run = async (request, message) => {
    try {
      await request();
      await load();
      toast.success(message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Admin action failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin panel</h1>

        {/* Loading skeleton placeholder */}
        {loading ? (
          <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
        ) : (
          <>
            {/* Section 1: Pending Profile Verifications */}
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Pending profiles</h2>
              {profiles.length ? (
                <div className="divide-y">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between py-3"
                    >
                      <span className="font-medium">
                        {profile.firstName} {profile.lastName}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            () => verifyProfile(profile.id),
                            "Profile verified"
                          )
                        }
                        className="rounded-lg bg-green-600 hover:bg-green-700 px-3 py-2 text-sm text-white font-medium transition"
                      >
                        Verify
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-slate-500">No pending profiles.</p>
              )}
            </section>

            {/* Section 2: Abuse & Moderation Reports */}
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Reports</h2>
              {reports.length ? (
                <div className="divide-y">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <span className="font-semibold text-red-600">
                          {report.reason}
                        </span>
                        <span className="text-slate-600 ml-2">
                          Reported:{" "}
                          {report.reported?.profile?.firstName ||
                            report.reported?.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            () => resolveReport(report.id),
                            "Report resolved"
                          )
                        }
                        className="rounded-lg border border-slate-300 hover:bg-slate-50 px-3 py-2 text-sm font-medium transition"
                      >
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-slate-500">No open reports.</p>
              )}
            </section>

            {/* Section 3: Registered Users List */}
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Users</h2>
              <div className="divide-y">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <span className="font-medium">{user.email}</span>
                      <span className="ml-2 text-xs uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {user.role}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        run(() => deleteUser(user.id), "User deleted")
                      }
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Admin;

