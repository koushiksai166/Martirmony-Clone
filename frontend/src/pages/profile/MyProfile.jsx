import { useEffect, useState } from "react";
import { Edit3, Eye, MapPin, ShieldCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../hooks/useAuth";
import {
  deleteProfile,
  getProfileViews,
  updateVisibility,
} from "../../services/profile.service";

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC", label: "Public", desc: "Visible to everyone" },
  { value: "MATCHES_ONLY", label: "Matches only", desc: "Only accepted matches" },
  { value: "HIDDEN", label: "Hidden", desc: "Not visible in search" },
];

function MyProfile() {
  const navigate = useNavigate();
  const { profile, loading, clearProfile } = useAuth();
  const [views, setViews] = useState(null);
  const [visibility, setVisibility] = useState("PUBLIC");
  const [savingVisibility, setSavingVisibility] = useState(false);

  useEffect(() => {
    if (profile) {
      setVisibility(profile.visibilityMode ?? "PUBLIC");
      getProfileViews()
        .then(({ data }) => setViews(data))
        .catch(() => {});
    }
  }, [profile]);

  const remove = async () => {
    if (!window.confirm("Delete your profile? This cannot be undone.")) return;
    try {
      await deleteProfile();
      clearProfile();
      toast.success("Profile deleted");
      navigate("/profile/create", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete profile");
    }
  };

  const handleVisibility = async (mode) => {
    setSavingVisibility(true);
    try {
      await updateVisibility(mode);
      setVisibility(mode);
      toast.success("Visibility updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update visibility");
    } finally {
      setSavingVisibility(false);
    }
  };

  const formatLastActive = (date) => {
    if (!date) return "Never";
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-96 animate-pulse rounded-2xl bg-[var(--surface-warm)]" />
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <Card className="p-12 text-center">
          <h1 className="display-font text-3xl">Your profile is waiting.</h1>
          <Button className="mt-6" onClick={() => navigate("/profile/create")}>
            Create profile
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  const name = `${profile.firstName} ${profile.lastName}`;

  const details = [
    ["Date of birth", profile.dateOfBirth?.slice(0, 10)],
    ["Height", profile.height ? `${profile.height} cm` : null],
    ["Religion", profile.religion],
    ["Caste", profile.caste],
    ["Mother tongue", profile.motherTongue],
    ["Education", profile.education],
    ["Occupation", profile.occupation],
    ["Annual income", profile.annualIncome ? `₹${Number(profile.annualIncome).toLocaleString("en-IN")}` : null],
    ["Phone", profile.phoneNumber ?? null],
  ];

  return (
    <DashboardLayout>
      <div className="space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Your story</p>
            <h1 className="display-font mt-2 text-4xl">My profile</h1>
            <p className="mt-2 text-[var(--ink-soft)]">This is how people will get to know you.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate("/profile/edit")}>
              <Edit3 size={16} /> Edit
            </Button>
            <Button variant="quiet" onClick={remove} className="text-[var(--danger)]">
              <Trash2 size={16} /> Delete
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold">{views?.total ?? "—"}</p>
            <p className="mt-1 text-xs text-slate-500">Profile views</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm font-semibold">
              {formatLastActive(profile.lastActiveAt)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Last active</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm font-semibold">
              {profile.isVerified ? (
                <span className="flex items-center justify-center gap-1 text-green-600">
                  <ShieldCheck size={14} /> Verified
                </span>
              ) : (
                <span className="text-amber-500">Pending</span>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-500">Verification</p>
          </Card>
          <Card className="p-4 text-center">
            <Badge tone={profile.isProfileComplete ? "success" : "rose"}>
              {profile.isProfileComplete ? "Complete" : "Incomplete"}
            </Badge>
            <p className="mt-1 text-xs text-slate-500">Profile status</p>
          </Card>
        </div>

        {/* Visibility control */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={16} className="text-slate-500" />
            <h3 className="font-semibold">Profile visibility</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {VISIBILITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleVisibility(opt.value)}
                disabled={savingVisibility}
                className={`rounded-lg border px-4 py-2 text-sm transition ${
                  visibility === opt.value
                    ? "border-pink-500 bg-pink-50 text-pink-700 font-semibold"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="ml-1 text-xs text-slate-500">— {opt.desc}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Main profile card */}
        <Card className="overflow-hidden">
          <div className="bg-[var(--ink)] p-7 text-white sm:p-10">
            <div className="flex flex-wrap items-center gap-6">
              <Avatar src={profile.profilePicture} name={name} size="lg" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="display-font text-3xl">{name}</h2>
                  {profile.isVerified && <ShieldCheck className="text-[#d9ad71]" size={20} />}
                </div>
                <p className="mt-2 flex items-center gap-2 text-white/65">
                  <MapPin size={15} />
                  {[profile.city, profile.state, profile.country].filter(Boolean).join(", ") || "Location private"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-7 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_.8fr]">
              <div>
                <h3 className="display-font text-2xl">About me</h3>
                <p className="mt-4 whitespace-pre-wrap leading-7 text-[var(--ink-soft)]">
                  {profile.aboutMe || "Add a few words about yourself."}
                </p>
              </div>
              <div>
                <h3 className="display-font text-2xl">The details</h3>
                <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-5">
                  {details.map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{label}</dt>
                      <dd className="mt-1 text-sm font-semibold">{value || "Not shared"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent viewers */}
        {views?.recentViews?.length > 0 && (
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Recent viewers</h3>
            <ul className="space-y-2">
              {views.recentViews.map((v) => (
                <li key={v.viewerId} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Anonymous viewer</span>
                  <span className="text-xs text-slate-400">
                    {new Date(v.viewedAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default MyProfile;
