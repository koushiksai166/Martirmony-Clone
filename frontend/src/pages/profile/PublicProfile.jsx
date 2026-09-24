import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import Avatar from "../../components/ui/Avatar";
import { getPublicProfile } from "../../services/search.service";
import { blockUser, reportUser } from "../../services/safety.service";

/**
 * PublicProfile Page
 *
 * Displays the full matrimonial profile of another member.
 * Accessible to any authenticated user who has been given a profile ID
 * (typically navigated to via a ProfileCard's "View profile" link).
 *
 * Features:
 * - Fetches profile data by `id` URL param via the `getPublicProfile` service
 * - Loading skeleton and "not found" empty state
 * - Displays: avatar, name, gender, location, verified badge
 * - Profile details grid: date of birth, height, religion, education, occupation, location
 * - "About [firstName]" bio section
 * - Block user action (hides from both sides)
 * - Report user action (prompts for reason category then submits to moderation)
 *
 * URL Param:
 * - `id` — the unique matrimonial profile ID to view (from `/profile/:id` route)
 */
function PublicProfile() {
  // Extract profile ID from URL params (e.g. /profile/abc123)
  const { id } = useParams();

  // Fetched public profile data
  const [profile, setProfile] = useState(null);

  // Loading state while fetching profile from API
  const [loading, setLoading] = useState(true);

  /**
   * Blocks the viewed user, preventing future contact and hiding profiles.
   * Prompts for confirmation before submitting.
   */
  const block = async () => {
    if (!window.confirm("Block this user?")) return;
    try {
      await blockUser(profile.userId);
      toast.success("User blocked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to block user");
    }
  };

  /**
   * Reports the viewed user to the moderation team.
   * Prompts for a reason category before submitting the report.
   * Accepted reasons: FAKE_PROFILE, HARASSMENT, INAPPROPRIATE_CONTENT, SPAM, OTHER
   */
  const report = async () => {
    const reason = window.prompt(
      "Reason: FAKE_PROFILE, HARASSMENT, INAPPROPRIATE_CONTENT, SPAM, or OTHER"
    );
    if (!reason) return;
    try {
      await reportUser(profile.userId, { reason });
      toast.success("Report submitted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to submit report");
    }
  };

  // Fetch the public profile on mount or when the profile ID changes
  useEffect(() => {
    getPublicProfile(id)
      .then(({ data }) => setProfile(data.profile))
      .catch((error) =>
        toast.error(error.response?.data?.message || "Profile not found")
      )
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <DashboardLayout>
      {loading ? (
        /* Loading skeleton */
        <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
      ) : !profile ? (
        /* Profile not found state */
        <div className="rounded-xl bg-white p-10 text-center">
          <h1 className="text-2xl font-semibold">Profile not found</h1>
          <Link to="/search" className="mt-4 inline-block text-pink-600">
            Back to search
          </Link>
        </div>
      ) : (
        /* Full profile view */
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Back navigation */}
          <Link to="/search" className="text-sm font-medium text-pink-600">
            Back to search
          </Link>

          {/* Header Card: Avatar, Name, Location, Verified Badge, Block/Report */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-5">
                <Avatar
                  src={profile.profilePicture}
                  name={`${profile.firstName} ${profile.lastName}`}
                  size="lg"
                />
                <div>
                  <h1 className="text-3xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <p className="mt-2 text-slate-600">
                    {profile.gender} · {profile.city || "Location not provided"}
                  </p>
                </div>
              </div>
              {/* Verified indicator badge */}
              {profile.isVerified && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  Verified
                </span>
              )}
            </div>

            {/* Profile Details Grid */}
            <dl className="mt-8 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Date of birth</dt>
                <dd className="font-medium">
                  {profile.dateOfBirth?.slice(0, 10)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Height</dt>
                <dd className="font-medium">{profile.height} cm</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Religion</dt>
                <dd className="font-medium">
                  {profile.religion || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Education</dt>
                <dd className="font-medium">
                  {profile.education || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Occupation</dt>
                <dd className="font-medium">
                  {profile.occupation || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Location</dt>
                <dd className="font-medium">
                  {[profile.city, profile.state, profile.country]
                    .filter(Boolean)
                    .join(", ") || "Not provided"}
                </dd>
              </div>
            </dl>

            {/* Safety Actions: Block / Report */}
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={block}
                className="rounded-lg border border-red-200 px-4 py-2 text-red-600"
              >
                Block
              </button>
              <button
                type="button"
                onClick={report}
                className="rounded-lg border px-4 py-2"
              >
                Report
              </button>
            </div>
          </section>

          {/* About Section */}
          <section className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              About {profile.firstName}
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-slate-600">
              {profile.aboutMe || "No introduction provided."}
            </p>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}

export default PublicProfile;

