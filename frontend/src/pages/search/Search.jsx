import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import { searchProfiles } from "../../services/search.service";

const filterFields = [["gender", "Gender"], ["city", "City"], ["religion", "Religion"], ["education", "Education"], ["minAge", "Min age"], ["maxAge", "Max age"]];

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(Object.fromEntries(searchParams.entries()));
  const [result, setResult] = useState({ profiles: [], pagination: {} });
  const [loading, setLoading] = useState(true);

  const load = async (params) => {
    setLoading(true);
    try {
      const { data } = await searchProfiles({ ...params, page: params.page || 1, limit: 12 });
      setResult(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to search profiles");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(Object.fromEntries(searchParams.entries())); }, [searchParams]);

  const submit = (event) => {
    event.preventDefault();
    const values = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
    setSearchParams(values);
  };

  const page = result.pagination.page || 1;
  const totalPages = result.pagination.totalPages || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold text-slate-900">Discover profiles</h1><p className="mt-2 text-slate-600">Search verified, complete profiles that fit your preferences.</p></div>
        <form onSubmit={submit} className="grid gap-4 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
          {filterFields.map(([name, label]) => <label key={name} className="block"><span className="text-sm font-medium text-slate-700">{label}</span>{name === "gender" ? <select name={name} value={filters[name] || ""} onChange={(e) => setFilters({ ...filters, [name]: e.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"><option value="">Any</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select> : <input name={name} value={filters[name] || ""} onChange={(e) => setFilters({ ...filters, [name]: e.target.value })} type={name.includes("Age") ? "number" : "text"} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" />}</label>)}
          <div className="flex items-end"><button type="submit" className="w-full rounded-lg bg-pink-600 px-5 py-3 font-medium text-white">Search</button></div>
        </form>
        {loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-56 animate-pulse rounded-xl bg-slate-200" />)}</div> : result.profiles.length === 0 ? <div className="rounded-xl bg-white p-10 text-center shadow-sm"><h2 className="text-xl font-semibold">No profiles found</h2><p className="mt-2 text-slate-600">Try broadening your filters.</p></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{result.profiles.map((profile) => <article key={profile.id} className="overflow-hidden rounded-xl bg-white shadow-sm"><div className="flex h-32 items-center justify-center bg-pink-50 text-4xl font-bold text-pink-600">{profile.firstName?.[0]}{profile.lastName?.[0]}</div><div className="p-5"><h2 className="text-xl font-semibold">{profile.firstName} {profile.lastName}</h2><p className="mt-1 text-sm text-slate-600">{profile.gender} · {profile.city || "Location not provided"}</p><p className="mt-1 text-sm text-slate-600">{profile.education || "Education not provided"}</p><Link to={`/profile/${profile.id}`} className="mt-4 inline-block font-medium text-pink-600">View profile</Link></div></article>)}</div>}
        {!loading && totalPages > 1 && <div className="flex items-center justify-center gap-4"><button disabled={page <= 1} onClick={() => setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: page - 1 })} className="rounded-lg border px-4 py-2 disabled:opacity-40">Previous</button><span className="text-sm text-slate-600">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setSearchParams({ ...Object.fromEntries(searchParams.entries()), page: page + 1 })} className="rounded-lg border px-4 py-2 disabled:opacity-40">Next</button></div>}
      </div>
    </DashboardLayout>
  );
}

export default Search;
