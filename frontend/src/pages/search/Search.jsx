import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import Card from "../../components/common/Card";
import ProfileCard from "../../components/common/ProfileCard";
import Button from "../../components/common/Button";
import { searchProfiles } from "../../services/search.service";
import { sendInterest } from "../../services/interest.service";

const fields = [["gender", "Gender"], ["city", "City"], ["religion", "Religion"], ["education", "Education"], ["minAge", "Minimum age"], ["maxAge", "Maximum age"]];

function Search() {
  const [params, setParams] = useSearchParams(); const [filters, setFilters] = useState(Object.fromEntries(params.entries())); const [result, setResult] = useState({ profiles: [], pagination: {} }); const [loading, setLoading] = useState(true); const [filterOpen, setFilterOpen] = useState(false); const [interestLoading, setInterestLoading] = useState(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    searchProfiles({ ...Object.fromEntries(params.entries()), page: params.get("page") || 1, limit: 12 })
      .then(({ data }) => setResult(data))
      .catch((error) => toast.error(error.response?.data?.message || "Unable to load profiles"))
      .finally(() => setLoading(false));
  }, [params]);
  const submit = (event) => { event.preventDefault(); setParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))); setFilterOpen(false); };
  const interest = async (profileId) => { setInterestLoading(profileId); try { await sendInterest(profileId); toast.success("Interest sent"); } catch (error) { toast.error(error.response?.data?.message || "Unable to send interest"); } finally { setInterestLoading(null); } };
  const page = result.pagination.page || 1; const totalPages = result.pagination.totalPages || 1;
  const form = <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">{fields.map(([name, label]) => <label key={name} className="block"><span className="field-label">{label}</span>{name === "gender" ? <select className="field-input mt-2" value={filters[name] || ""} onChange={(e) => setFilters({ ...filters, [name]: e.target.value })}><option value="">Any</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select> : <input className="field-input mt-2" type={name.includes("Age") ? "number" : "text"} value={filters[name] || ""} onChange={(e) => setFilters({ ...filters, [name]: e.target.value })} />}</label>)}<Button type="submit" className="sm:col-span-2">Apply filters</Button></form>;
  return <DashboardLayout><div className="space-y-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Discover</p><h1 className="display-font mt-2 text-4xl">People who share your direction.</h1><p className="mt-3 text-[var(--ink-soft)]">Use the filters to make your search feel more like you.</p></div><button type="button" onClick={() => setFilterOpen(true)} className="btn-secondary lg:hidden"><SlidersHorizontal size={17} /> Filters</button></div><div className="grid gap-8 lg:grid-cols-[250px_1fr]"><aside className="hidden lg:block"><Card className="sticky top-6 p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Refine search</h2><button type="button" onClick={() => { setFilters({}); setParams({}); }} className="text-xs font-bold text-[var(--rose)]">Reset</button></div><div className="mt-5">{form}</div></Card></aside><section><div className="mb-5 flex items-center justify-between text-sm text-[var(--ink-soft)]"><span>{loading ? "Finding profiles..." : `${result.pagination.total || 0} profiles found`}</span><span>Recently updated</span></div>{loading ? <div className="grid gap-5 sm:grid-cols-2">{[1, 2, 3, 4].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl bg-[var(--surface-warm)]" />)}</div> : result.profiles.length ? <div className="grid gap-5 sm:grid-cols-2">{result.profiles.map((profile) => <ProfileCard key={profile.id} profile={profile} onInterest={interest} interestLoading={interestLoading === profile.id} />)}</div> : <Card className="p-12 text-center"><h2 className="display-font text-2xl">Nothing quite yet.</h2><p className="mt-2 text-[var(--ink-soft)]">Try opening up one of your filters and searching again.</p></Card>}{totalPages > 1 && <div className="mt-7 flex items-center justify-center gap-4"><button type="button" disabled={page <= 1} onClick={() => setParams({ ...Object.fromEntries(params.entries()), page: page - 1 })} className="btn-secondary disabled:opacity-40">Previous</button><span className="text-sm text-[var(--ink-soft)]">Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setParams({ ...Object.fromEntries(params.entries()), page: page + 1 })} className="btn-secondary disabled:opacity-40">Next</button></div>}</section></div>{filterOpen && <div className="fixed inset-0 z-30 bg-[var(--ink)]/30 p-5 lg:hidden"><div className="ml-auto max-w-md rounded-2xl bg-[var(--surface)] p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="display-font text-2xl">Filters</h2><button type="button" aria-label="Close filters" onClick={() => setFilterOpen(false)} className="btn-quiet"><X size={20} /></button></div><div className="mt-5">{form}</div></div></div>}</div></DashboardLayout>;
}

export default Search;
