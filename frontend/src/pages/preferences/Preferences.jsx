import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getPreferences,
  savePreferences,
} from "../../services/preference.service";

// Configuration for preference input fields: [fieldKey, fieldLabel]
const fields = [
  ["minAge", "Minimum age"],
  ["maxAge", "Maximum age"],
  ["minHeight", "Minimum height (cm)"],
  ["maxHeight", "Maximum height (cm)"],
  ["religion", "Religion"],
  ["caste", "Caste"],
  ["motherTongue", "Mother tongue"],
  ["education", "Education"],
  ["occupation", "Occupation"],
  ["minIncome", "Minimum income (INR)"],
  ["maxIncome", "Maximum income (INR)"],
  ["country", "Country"],
  ["state", "State"],
  ["city", "City"],
];

/**
 * Partner Preferences Page Component
 *
 * Allows authenticated members to customize matching criteria:
 * - Age boundaries (minAge, maxAge)
 * - Height boundaries (minHeight, maxHeight)
 * - Cultural background (religion, caste, mother tongue)
 * - Professional criteria (education, occupation, income range)
 * - Geographic preferences (country, state, city)
 * - Converts numeric fields before submission and updates preference records on the server.
 */
function Preferences() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current saved partner preferences on mount
  useEffect(() => {
    getPreferences()
      .then(({ data }) => setValues(data.preference || {}))
      .catch((error) =>
        toast.error(
          error.response?.data?.message || "Unable to load preferences"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  /**
   * Generic input change handler for controlled inputs
   */
  const update = (event) =>
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  /**
   * Cleans payload, casts numeric fields, and updates preferences via API
   */
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      // Filter out empty string/null values
      const payload = Object.fromEntries(
        Object.entries(values).filter(
          ([, value]) => value !== "" && value !== null && value !== undefined
        )
      );

      // Coerce numeric fields to numbers
      [
        "minAge",
        "maxAge",
        "minHeight",
        "maxHeight",
        "minIncome",
        "maxIncome",
      ].forEach((key) => {
        if (payload[key] !== undefined) payload[key] = Number(payload[key]);
      });

      const { data } = await savePreferences(payload);
      setValues(data.preference);
      toast.success("Preferences saved");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to save preferences"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <form onSubmit={submit} className="mx-auto max-w-4xl space-y-6">
        {/* Header Title */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Partner preferences
          </h1>
          <p className="mt-2 text-slate-600">
            Set the details you value in a potential match.
          </p>
        </div>

        {/* Preferences Form Fields Grid */}
        {loading ? (
          <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
        ) : (
          <section className="grid gap-5 rounded-xl bg-white p-6 shadow-sm sm:grid-cols-2">
            {fields.map(([name, label]) => (
              <label key={name} className="block">
                <span className="text-sm font-medium text-slate-700">
                  {label}
                </span>
                <input
                  name={name}
                  value={values[name] || ""}
                  onChange={update}
                  type={
                    name.includes("Age") ||
                    name.includes("Height") ||
                    name.includes("Income")
                      ? "number"
                      : "text"
                  }
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />
              </label>
            ))}
          </section>
        )}

        {/* Form Submission Button */}
        <div className="flex justify-end">
          <button
            disabled={saving || loading}
            type="submit"
            className="rounded-lg bg-pink-600 hover:bg-pink-700 px-5 py-3 font-medium text-white disabled:opacity-60 transition"
          >
            {saving ? "Saving..." : "Save preferences"}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default Preferences;

