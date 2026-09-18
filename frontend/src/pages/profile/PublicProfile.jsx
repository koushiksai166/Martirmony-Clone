import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import Avatar from "../../components/ui/Avatar";
import { getPublicProfile } from "../../services/search.service";
import { blockUser, reportUser } from "../../services/safety.service";

function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const block = async () => {
    if (!window.confirm("Block this user?")) return;
    try { await blockUser(profile.userId); toast.success("User blocked"); } catch (error) { toast.error(error.response?.data?.message || "Unable to block user"); }
  };

  const report = async () => {
    const reason = window.prompt("Reason: FAKE_PROFILE, HARASSMENT, INAPPROPRIATE_CONTENT, SPAM, or OTHER");
    if (!reason) return;
    try { await reportUser(profile.userId, { reason }); toast.success("Report submitted"); } catch (error) { toast.error(error.response?.data?.message || "Unable to submit report"); }
  };

  useEffect(() => {
    getPublicProfile(id)
      .then(({ data }) => setProfile(data.profile))
      .catch((error) => toast.error(error.response?.data?.message || "Profile not found"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <DashboardLayout>
      {loading ? (
        <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
      ) : !profile ? (
        <div className="rounded-xl bg-white p-10 text-center">
          <h1 className="text-2xl font-semibold">Profile not found</h1>
          <Link to="/search" className="mt-4 inline-block text-pink-600">Back to search</Link>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-6">
          <Link to="/search" className="text-sm font-medium text-pink-600">Back to search</Link>
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-5">
                <Avatar src={profile.profilePicture} name={`${profile.firstName} ${profile.lastName}`} size="lg" />
                <div>
                  <h1 className="text-3xl font-bold">{profile.firstName} {profile.lastName}</h1>
                  <p className="mt-2 text-slate-600">{profile.gender} · {profile.city || "Location not provided"}</p>
                </div>
              </div>
              {profile.isVerified && <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">Verified</span>}
            </div>
            <dl className="mt-8 grid gap-5 sm:grid-cols-2">
              <div><dt className="text-sm text-slate-500">Date of birth</dt><dd className="font-medium">{profile.dateOfBirth?.slice(0, 10)}</dd></div>
              <div><dt className="text-sm text-slate-500">Height</dt><dd className="font-medium">{profile.height} cm</dd></div>
              <div><dt className="text-sm text-slate-500">Religion</dt><dd className="font-medium">{profile.religion || "Not provided"}</dd></div>
              <div><dt className="text-sm text-slate-500">Education</dt><dd className="font-medium">{profile.education || "Not provided"}</dd></div>
              <div><dt className="text-sm text-slate-500">Occupation</dt><dd className="font-medium">{profile.occupation || "Not provided"}</dd></div>
              <div><dt className="text-sm text-slate-500">Location</dt><dd className="font-medium">{[profile.city, profile.state, profile.country].filter(Boolean).join(", ") || "Not provided"}</dd></div>
            </dl>
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={block} className="rounded-lg border border-red-200 px-4 py-2 text-red-600">Block</button>
              <button type="button" onClick={report} className="rounded-lg border px-4 py-2">Report</button>
            </div>
          </section>
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">About {profile.firstName}</h2>
            <p className="mt-4 whitespace-pre-wrap text-slate-600">{profile.aboutMe || "No introduction provided."}</p>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default PublicProfile;
