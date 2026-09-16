import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import ProfileCard from "../../components/common/ProfileCard";
import Card from "../../components/common/Card";
import { getMatches } from "../../services/match.service";
import { sendInterest } from "../../services/interest.service";

function Matches() {
  const [matches, setMatches] = useState([]); const [loading, setLoading] = useState(true); const [interestLoading, setInterestLoading] = useState(null);
  useEffect(() => { getMatches().then(({ data }) => setMatches(data.matches || [])).catch((error) => toast.error(error.response?.data?.message || "Unable to load matches")).finally(() => setLoading(false)); }, []);
  const interest = async (id) => { setInterestLoading(id); try { await sendInterest(id); toast.success("Interest sent"); } catch (error) { toast.error(error.response?.data?.message || "Unable to send interest"); } finally { setInterestLoading(null); } };
  return <DashboardLayout><div className="space-y-8"><div><p className="eyebrow">A considered shortlist</p><h1 className="display-font mt-2 text-4xl">Your matches</h1><p className="mt-3 max-w-2xl text-[var(--ink-soft)]">A compatibility score is a conversation starter based on your preferences, never a promise about a person.</p></div>{loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-[var(--surface-warm)]" />)}</div> : matches.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{matches.map(({ profile, compatibility }) => <ProfileCard key={profile.id} profile={profile} compatibility={compatibility} onInterest={interest} interestLoading={interestLoading === profile.id} />)}</div> : <Card className="p-12 text-center"><h2 className="display-font text-2xl">Your shortlist is taking shape.</h2><p className="mt-2 text-[var(--ink-soft)]">Set preferences to make recommendations more personal.</p></Card>}</div></DashboardLayout>;
}

export default Matches;
