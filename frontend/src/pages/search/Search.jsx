import { Bookmark, BookmarkCheck, MapPin, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import Card from "../../components/common/Card";
import ProfileCard from "../../components/common/ProfileCard";
import Button from "../../components/common/Button";
import {
  searchProfiles,
  saveSearch,
  getSavedSearches,
  deleteSavedSearch,
  toggleSavedSearchAlert,
} from "../../services/search.service";
import { sendInterest } from "../../services/interest.service";

const SORT_OPTIONS = [
  { value: "lastActive", label: "Last active" },
  { value: "newest", label: "Newest" },
  { value: "distance", label: "Nearest" },
  { value: "compatibility", label: "Compatibility" },
];

const FILTER_FIELDS = [
  ["gender", "Gender", "select"],
  ["religion", "Religion", "text"],
  ["caste", "Caste", "text"],
  ["education", "Education", "text"],
  ["occupation", "Occupation", "text"],
  ["city", "City", "text"],
  ["minAge", "Min age", "number"],
  ["maxAge", "Max age", "number"],
  ["minHeight", "Min height (cm)", "number"],
  ["maxHeight", "Max height (cm)", "number"],
  ["excludeCastes", "Exclude castes (comma-separated)", "text"],
  ["excludeReligions", "Exclude religions (comma-separated)", "text"],
];

function Search() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(Object.fromEntries(params.entries()));
  const [result, setResult] = useState({ profiles: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [interestLoading, setInterestLoading] = useState(null);
  const [savedSearches, setSavedSearches] = useState([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef(null);

  // Load saved searches on mount
  useEffect(() => {
    getSavedSearches()
      .then(({ data }) => setSavedSearches(data))
      .catch(() => {});
  }, []);

  // Fetch profiles when URL params change
  useEffect(() => {
    setLoading(true);
    searchProfiles({
      ...Object.fromEntries(params.entries()),
      page: params.get("page") || 1,
      limit: 12,
    })
      .then(({ data }) => setResult(data))
      .catch((err) => toast.error(err.response?.data?.message || "Unable to load profiles"))
      .finally(() => setLoading(false));
  }, [params]);

  // Debounced full-text search on q input
  const handleQ = (value) => {
    setFilters((f) => ({ ...f, q: value }));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = { ...Object.fromEntries(params.entries()), q: value };
      if (!value) delete next.q;
      setParams(next);
    }, 400);
  };

  const submit = (e) => {
    e.preventDefault();
    setParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
    setFilterOpen(false);
  };

  const reset = () => {
    setFilters({});
    setParams({});
  };

  const interest = async (profileId) => {
    setInterestLoading(profileId);
    try {
      await sendInterest(profileId);
      toast.success("Interest sent");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to send interest");
    } finally {
      setInterestLoading(null);
    }
  };

  // Geolocation for radius search
  const locateMe = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFilters((f) => ({
          ...f,
          lat: coords.latitude.toFixed(6),
          lng: coords.longitude.toFixed(6),
          radiusKm: f.radiusKm || "50",
        }));
        setLocating(false);
        toast.success("Location detected");
      },
      () => {
        setLocating(false);
        toast.error("Unable to get location");
      },
    );
  };

  // Saved searches
  const handleSave = async () => {
    if (!saveName.trim()) return;
    try {
      const currentFilters = Object.fromEntries(params.entries());
      const { data } = await saveSearch({ name: saveName.trim(), filters: currentFilters });
      setSavedSearches((prev) => [data, ...prev]);
      setSaveModalOpen(false);
      setSaveName("");
      toast.success("Search saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save search");
    }
  };

  const handleLoadSaved = (saved) => {
    const f = saved.filters;
    setFilters(f);
    setParams(Object.fromEntries(Object.entries(f).filter(([, v]) => v)));
  };

  const handleDeleteSaved = async (id) => {
    try {
      await deleteSavedSearch(id);
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
      toast.success("Saved search deleted");
    } catch {
      toast.error("Unable to delete saved search");
    }
  };

  const handleToggleAlert = async (id, current) => {
    try {
      const { data } = await toggleSavedSearchAlert(id, !current);
      setSavedSearches((prev) => prev.map((s) => (s.id === id ? data : s)));
    } catch {
      toast.error("Unable to update alert");
    }
  };

  const page = result.pagination.page || 1;
  const totalPages = result.pagination.totalPages || 1;

  const filterForm = (
    <form onSubmit={submit} className="space-y-4">
      {FILTER_FIELDS.map(([name, label, type]) => (
        <label key={name} className="block">
          <span className="field-label text-sm font-medium text-slate-700">{label}</span>
          {type === "select" ? (
            <select
              className="field-input mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={filters[name] || ""}
              onChange={(e) => setFilters({ ...filters, [name]: e.target.value })}
            >
              <option value="">Any</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          ) : (
            <input
              className="field-input mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              type={type}
              value={filters[name] || ""}
              onChange={(e) => setFilters({ ...filters, [name]: e.target.value })}
            />
          )}
        </label>
      ))}

      {/* Radius search */}
      <div className="rounded-lg border border-slate-200 p-3 space-y-2">
        <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
          <MapPin size={14} /> Radius search
        </p>
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          className="text-xs text-pink-600 hover:underline disabled:opacity-50"
        >
          {locating ? "Detecting..." : "Use my location"}
        </button>
        {filters.lat && (
          <p className="text-xs text-slate-500">
            📍 {Number(filters.lat).toFixed(3)}, {Number(filters.lng).toFixed(3)}
          </p>
        )}
        <label className="block">
          <span className="text-xs text-slate-600">Radius (km)</span>
          <input
            type="number"
            min="1"
            max="500"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            value={filters.radiusKm || ""}
            onChange={(e) => setFilters({ ...filters, radiusKm: e.target.value })}
          />
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">Apply</Button>
        <button type="button" onClick={reset} className="text-sm text-pink-600 hover:underline px-2">
          Reset
        </button>
      </div>
    </form>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Discover</p>
            <h1 className="display-font mt-2 text-4xl">People who share your direction.</h1>
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="btn-secondary lg:hidden"
          >
            <SlidersHorizontal size={17} /> Filters
          </button>
        </div>

        {/* Full-text search bar + sort + save */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="search"
            placeholder="Search by name, occupation, city, about me..."
            value={filters.q || ""}
            onChange={(e) => handleQ(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-4 py-2.5 text-sm"
          />
          <select
            value={filters.sortBy || "lastActive"}
            onChange={(e) => {
              const next = { ...Object.fromEntries(params.entries()), sortBy: e.target.value };
              setFilters((f) => ({ ...f, sortBy: e.target.value }));
              setParams(next);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSaveModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2.5 text-sm hover:bg-slate-50"
            title="Save this search"
          >
            <Bookmark size={15} /> Save search
          </button>
        </div>

        {/* Saved searches chips */}
        {savedSearches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs"
              >
                <button
                  type="button"
                  onClick={() => handleLoadSaved(s)}
                  className="font-medium text-slate-700 hover:text-pink-600"
                >
                  {s.name}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAlert(s.id, s.alertEnabled)}
                  title={s.alertEnabled ? "Disable alert" : "Enable alert"}
                  className={s.alertEnabled ? "text-pink-500" : "text-slate-400"}
                >
                  <BookmarkCheck size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSaved(s.id)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Layout */}
        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block">
            <Card className="sticky top-6 p-5">
              <h2 className="font-bold mb-4">Refine search</h2>
              {filterForm}
            </Card>
          </aside>

          {/* Results */}
          <section>
            <div className="mb-5 flex items-center justify-between text-sm text-[var(--ink-soft)]">
              <span>
                {loading ? "Finding profiles..." : `${result.pagination.total || 0} profiles found`}
              </span>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-2xl bg-[var(--surface-warm)]" />
                ))}
              </div>
            ) : result.profiles.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {result.profiles.map((profile) => (
                  <div key={profile.id} className="relative">
                    <ProfileCard
                      profile={profile}
                      onInterest={interest}
                      interestLoading={interestLoading === profile.id}
                    />
                    {profile.distanceKm != null && (
                      <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-600 shadow">
                        {profile.distanceKm.toFixed(0)} km
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <h2 className="display-font text-2xl">Nothing quite yet.</h2>
                <p className="mt-2 text-[var(--ink-soft)]">
                  Try opening up one of your filters and searching again.
                </p>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-7 flex items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setParams({ ...Object.fromEntries(params.entries()), page: page - 1 })}
                  className="btn-secondary disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-[var(--ink-soft)]">Page {page} of {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setParams({ ...Object.fromEntries(params.entries()), page: page + 1 })}
                  className="btn-secondary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Mobile filter drawer */}
        {filterOpen && (
          <div className="fixed inset-0 z-30 bg-[var(--ink)]/30 p-5 lg:hidden">
            <div className="ml-auto max-w-md rounded-2xl bg-[var(--surface)] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="display-font text-2xl">Filters</h2>
                <button type="button" onClick={() => setFilterOpen(false)} className="btn-quiet">
                  <X size={20} />
                </button>
              </div>
              {filterForm}
            </div>
          </div>
        )}

        {/* Save search modal */}
        {saveModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h2 className="font-bold text-lg mb-3">Save this search</h2>
              <input
                type="text"
                placeholder="e.g. Engineers in Hyderabad"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">Save</Button>
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Search;
