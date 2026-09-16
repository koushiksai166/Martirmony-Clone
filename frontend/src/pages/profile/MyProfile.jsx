import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { deleteProfile } from "../../services/profile.service";
import DashboardLayout from "../../layouts/DashboardLayout";

function MyProfile() {
  const navigate = useNavigate();
  const { profile, loading, clearProfile } = useAuth();

  const handleDelete = async () => {
    if (!window.confirm("Delete your profile? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteProfile();
      clearProfile();
      toast.success("Profile deleted successfully");
      navigate("/profile/create", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete profile");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200" />
          <div className="h-64 rounded bg-slate-200" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-semibold">Profile not found</h1>
          <button
            type="button"
            onClick={() => navigate("/profile/create")}
            className="mt-6 rounded-lg bg-pink-600 px-5 py-3 text-white"
          >
            Create profile
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const fields = [
    ["Gender", profile.gender],
    ["Date of birth", profile.dateOfBirth?.slice(0, 10)],
    ["Height", profile.height ? `${profile.height} cm` : "Not provided"],
    ["Religion", profile.religion],
    ["Caste", profile.caste],
    ["Mother tongue", profile.motherTongue],
    ["Education", profile.education],
    ["Occupation", profile.occupation],
    ["Annual income", profile.annualIncome],
    ["Location", [profile.city, profile.state, profile.country].filter(Boolean).join(", ")],
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-pink-600">
              My profile
            </p>
            <h1 className="mt-1 text-4xl font-bold text-slate-900">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="mt-2 text-slate-600">
              {profile.isProfileComplete ? "Profile complete" : "Profile needs attention"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/profile/edit")}
              className="rounded-lg bg-pink-600 px-5 py-3 font-medium text-white hover:bg-pink-700"
            >
              Edit profile
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-red-200 px-5 py-3 font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Personal details</h2>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="mt-1 font-medium text-slate-900">{value || "Not provided"}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">About me</h2>
          <p className="mt-4 whitespace-pre-wrap text-slate-600">
            {profile.aboutMe || "No introduction added yet."}
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default MyProfile;