import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getMatches } from "../../services/match.service";

function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getMatches().then(({ data }) => setMatches(data.matches || [])).catch((error) => toast.error(error.response?.data?.message || "Unable to load matches")).finally(() => setLoading(false)); }, []);
  return <DashboardLayout><div className="space-y-6"><div><h1 className="text-3xl font-bold">Your matches</h1><p className="mt-2 text-slate-600">Compatibility is an application score based on your saved preferences.</p></div>{loading ? <div className="h-64 animate-pulse rounded-xl bg-slate-200" /> : matches.length === 0 ? <div className="rounded-xl bg-white p-10 text-center shadow-sm"><h2 className="text-xl font-semibold">No matches yet</h2><p className="mt-2 text-slate-600">Set your preferences to improve your results.</p></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{matches.map(({ profile, compatibility }) => <article key={profile.id} className="rounded-xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{profile.firstName} {profile.lastName}</h2><span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-semibold text-pink-700">{compatibility}%</span></div><p className="mt-2 text-sm text-slate-600">{profile.city || "Location not provided"} · {profile.education || "Education not provided"}</p><Link to={`/profile/${profile.id}`} className="mt-4 inline-block font-medium text-pink-600">View profile</Link></article>)}</div>}</div></DashboardLayout>;
}
export default Matches;
