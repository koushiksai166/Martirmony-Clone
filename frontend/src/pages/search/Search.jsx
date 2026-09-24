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

/**
 * Filterable search field definitions: [queryParamKey, displayLabel]
 * Used to dynamically render filter input controls.
 */
const fields = [
  ["gender", "Gender"],
  ["city", "City"],
  ["religion", "Religion"],
  ["education", "Education"],
  ["minAge", "Minimum age"],
  ["maxAge", "Maximum age"],
];

/**
 * Search Page
 *
 * Matrimonial profile discovery and filtering interface.
 *
 * Features:
 * - Sidebar filter panel (desktop) and slide-in drawer (mobile)
 * - Filter fields: gender, city, religion, education, age range
 * - Profile results rendered via `ProfileCard` in a responsive grid
 * - Paginated results with Previous/Next navigation
 * - Quick "Send Interest" action directly from search results
 * - URL query param sync: filters and page are reflected in the browser URL
 *
 * State:
 * - `params` / `setParams`: React Router URLSearchParams for filter persistence
 * - `filters`: Local controlled form state for pending filter edits
 * - `result`: API response containing profiles array + pagination metadata
 * - `loading`: Fetch-in-progress flag for skeleton rendering
 * - `filterOpen`: Controls mobile filter drawer visibility
 * - `interestLoading`: Tracks which profile's interest button is pending
 */
function Search() {
  // Sync filter state with browser URL query parameters
  const [params, setParams] = useSearchParams();

  // Controlled filter form values (not yet applied)
  const [filters, setFilters] = useState(Object.fromEntries(params.entries()));

  // API search results: { profiles: [], pagination: { page, totalPages, total } }
  const [result, setResult] = useState({ profiles: [], pagination: {} });

  // Loading state for profile fetch
  const [loading, setLoading] = useState(true);

  // Mobile filter drawer visibility
  const [filterOpen, setFilterOpen] = useState(false);

  // Currently-loading interest button (stores the profile.id string or null)
  const [interestLoading, setInterestLoading] = useState(null);

  /**
   * Fetch profiles whenever URL search params change (filter apply or page change).
   * Defaults to page 1, limit 12 per page.
   */
  useEffect(() => {
    setLoading(true);
    searchProfiles({
      ...Object.fromEntries(params.entries()),
      page: params.get("page") || 1,
      limit: 12,
    })
      .then(({ data }) => setResult(data))
      .catch((error) =>
        toast.error(error.response?.data?.message || "Unable to load profiles")
      )
      .finally(() => setLoading(false));
  }, [params]);

  /**
   * Applies pending filter form values to URL query params.
   * Strips out empty/undefined fields before setting.
   * @param {React.FormEvent} event - Form submit event
   */
  const submit = (event) => {
    event.preventDefault();
    // Only include filter fields with non-empty values
    setParams(
      Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
    );
    setFilterOpen(false);
  };

  /**
   * Sends an interest (connection request) to a target profile.
   * Shows loading on the specific card's button while the request is in flight.
   * @param {string} profileId - ID of the recipient profile
   */
  const interest = async (profileId) => {
    setInterestLoading(profileId);
    try {
      await sendInterest(profileId);
      toast.success("Interest sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send interest");
    } finally {
      setInterestLoading(null);
    }
  };

  // Current page and total pages derived from API pagination metadata
  const page = result.pagination.page || 1;
  const totalPages = result.pagination.totalPages || 1;

  /**
   * Renders the reusable filter form used in both the sidebar panel
   * and the mobile drawer. Generates inputs dynamically from `fields`.
   */
  const form = (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      {fields.map(([name, label]) => (
        <label key={name} className="block">
          <span className="field-label">{label}</span>
          {/* Gender uses a dropdown; age fields use number type; all others use text */}
          {name === "gender" ? (
            <select
              className="field-input mt-2"
              value={filters[name] || ""}
              onChange={(e) =>
                setFilters({ ...filters, [name]: e.target.value })
              }
            >
              <option value="">Any</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          ) : (
            <input
              className="field-input mt-2"
              type={name.includes("Age") ? "number" : "text"}
              value={filters[name] || ""}
              onChange={(e) =>
                setFilters({ ...filters, [name]: e.target.value })
              }
            />
          )}
        </label>
      ))}
      <Button type="submit" className="sm:col-span-2">
        Apply filters
      </Button>
    </form>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Discover</p>
            <h1 className="display-font mt-2 text-4xl">
              People who share your direction.
            </h1>
            <p className="mt-3 text-[var(--ink-soft)]">
              Use the filters to make your search feel more like you.
            </p>
          </div>
          {/* Mobile: Open filter drawer button (hidden on desktop) */}
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="btn-secondary lg:hidden"
          >
            <SlidersHorizontal size={17} /> Filters
          </button>
        </div>

        {/* Two-column layout: sidebar filter + results grid */}
        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          {/* Desktop Sidebar Filter Panel */}
          <aside className="hidden lg:block">
            <Card className="sticky top-6 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Refine search</h2>
                {/* Reset all active filters */}
                <button
                  type="button"
                  onClick={() => {
                    setFilters({});
                    setParams({});
                  }}
                  className="text-xs font-bold text-[var(--rose)]"
                >
                  Reset
                </button>
              </div>
              <div className="mt-5">{form}</div>
            </Card>
          </aside>

          {/* Results Section */}
          <section>
            {/* Results count / sort label */}
            <div className="mb-5 flex items-center justify-between text-sm text-[var(--ink-soft)]">
              <span>
                {loading
                  ? "Finding profiles..."
                  : `${result.pagination.total || 0} profiles found`}
              </span>
              <span>Recently updated</span>
            </div>

            {/* Loading Skeleton Grid */}
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-64 animate-pulse rounded-2xl bg-[var(--surface-warm)]"
                  />
                ))}
              </div>
            ) : result.profiles.length ? (
              /* Profile results grid */
              <div className="grid gap-5 sm:grid-cols-2">
                {result.profiles.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    onInterest={interest}
                    interestLoading={interestLoading === profile.id}
                  />
                ))}
              </div>
            ) : (
              /* Empty state */
              <Card className="p-12 text-center">
                <h2 className="display-font text-2xl">Nothing quite yet.</h2>
                <p className="mt-2 text-[var(--ink-soft)]">
                  Try opening up one of your filters and searching again.
                </p>
              </Card>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-7 flex items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setParams({
                      ...Object.fromEntries(params.entries()),
                      page: page - 1,
                    })
                  }
                  className="btn-secondary disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-[var(--ink-soft)]">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setParams({
                      ...Object.fromEntries(params.entries()),
                      page: page + 1,
                    })
                  }
                  className="btn-secondary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Mobile Filter Drawer (rendered as fixed overlay when filterOpen is true) */}
        {filterOpen && (
          <div className="fixed inset-0 z-30 bg-[var(--ink)]/30 p-5 lg:hidden">
            <div className="ml-auto max-w-md rounded-2xl bg-[var(--surface)] p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="display-font text-2xl">Filters</h2>
                {/* Close drawer */}
                <button
                  type="button"
                  aria-label="Close filters"
                  onClick={() => setFilterOpen(false)}
                  className="btn-quiet"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mt-5">{form}</div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Search;

