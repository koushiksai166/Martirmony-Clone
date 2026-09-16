import { Edit3, MapPin, ShieldCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../hooks/useAuth";
import { deleteProfile } from "../../services/profile.service";

function MyProfile() {
  const navigate = useNavigate(); const { profile, loading, clearProfile } = useAuth();
  const remove = async () => { if (!window.confirm("Delete your profile? This cannot be undone.")) return; try { await deleteProfile(); clearProfile(); toast.success("Profile deleted"); navigate("/profile/create", { replace: true }); } catch (error) { toast.error(error.response?.data?.message || "Unable to delete profile"); } };
  if (loading) return <DashboardLayout><div className="h-96 animate-pulse rounded-2xl bg-[var(--surface-warm)]" /></DashboardLayout>;
  if (!profile) return <DashboardLayout><Card className="p-12 text-center"><h1 className="display-font text-3xl">Your profile is waiting.</h1><Button className="mt-6" onClick={() => navigate("/profile/create")}>Create profile</Button></Card></DashboardLayout>;
  const name = `${profile.firstName} ${profile.lastName}`; const details = [["Date of birth", profile.dateOfBirth?.slice(0, 10)], ["Height", profile.height ? `${profile.height} cm` : null], ["Religion", profile.religion], ["Caste", profile.caste], ["Mother tongue", profile.motherTongue], ["Education", profile.education], ["Occupation", profile.occupation], ["Annual income", profile.annualIncome ? `₹${Number(profile.annualIncome).toLocaleString("en-IN")}` : null]];
  return <DashboardLayout><div className="space-y-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Your story</p><h1 className="display-font mt-2 text-4xl">My profile</h1><p className="mt-2 text-[var(--ink-soft)]">This is how people will get to know you.</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => navigate("/profile/edit")}><Edit3 size={16} /> Edit</Button><Button variant="quiet" onClick={remove} className="text-[var(--danger)]"><Trash2 size={16} /> Delete</Button></div></div><Card className="overflow-hidden"><div className="bg-[var(--ink)] p-7 text-white sm:p-10"><div className="flex flex-wrap items-center gap-6"><Avatar src={profile.profilePicture} name={name} size="lg" /><div><div className="flex flex-wrap items-center gap-2"><h2 className="display-font text-3xl">{name}</h2>{profile.isVerified && <ShieldCheck className="text-[#d9ad71]" size={20} />}</div><p className="mt-2 flex items-center gap-2 text-white/65"><MapPin size={15} /> {[profile.city, profile.state, profile.country].filter(Boolean).join(", ") || "Location private"}</p><div className="mt-4"><Badge tone={profile.isProfileComplete ? "success" : "rose"}>{profile.isProfileComplete ? "Profile complete" : "Keep building your profile"}</Badge></div></div></div></div><div className="p-7 sm:p-10"><div className="grid gap-8 lg:grid-cols-[1fr_.8fr]"><div><h3 className="display-font text-2xl">About me</h3><p className="mt-4 whitespace-pre-wrap leading-7 text-[var(--ink-soft)]">{profile.aboutMe || "Add a few words about yourself."}</p></div><div><h3 className="display-font text-2xl">The details</h3><dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-5">{details.map(([label, value]) => <div key={label}><dt className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{label}</dt><dd className="mt-1 text-sm font-semibold">{value || "Not shared"}</dd></div>)}</dl></div></div></div></Card></div></DashboardLayout>;
}

export default MyProfile;
