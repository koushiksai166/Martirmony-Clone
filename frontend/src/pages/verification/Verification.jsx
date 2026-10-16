import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { requestVerification, getVerificationStatus } from "../../services/safety.service";
import { toast } from "react-toastify";
import { ShieldCheck, Upload } from "lucide-react";

const DOC_TYPES = ["AADHAAR", "PASSPORT", "PAN", "DRIVING_LICENSE", "VOTER_ID"];

const STATUS_STYLES = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

function Verification() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState("AADHAAR");
  const [docUrl, setDocUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getVerificationStatus()
      .then(({ data }) => setStatus(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docUrl.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await requestVerification({ documentType: docType, documentUrl: docUrl.trim() });
      setStatus(data);
      toast.success("Verification request submitted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-xl">
        <div>
          <h1 className="text-3xl font-bold">Background Verification</h1>
          <p className="mt-2 text-slate-600">
            Verify your identity to build trust with potential matches.
          </p>
        </div>

        {/* Current status */}
        {!loading && status && (
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-2">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-pink-600" />
              <h2 className="font-semibold">Verification Status</h2>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[status.status] || ""}`}>
                {status.status}
              </span>
              <span className="text-sm text-slate-500">{status.documentType}</span>
            </div>
            {status.notes && (
              <p className="text-sm text-slate-600 mt-2 border-l-2 border-pink-200 pl-3">{status.notes}</p>
            )}
          </div>
        )}

        {/* Submit / resubmit form */}
        {(!status || status.status === "REJECTED") && (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Upload size={18} /> Submit Document
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
              >
                {DOC_TYPES.map((d) => <option key={d}>{d}</option>)}
              </select>
              <input
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="Document URL (upload via profile photo uploader first)"
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
                required
              />
              <p className="text-xs text-slate-400">
                Upload your document image first using the profile uploader, then paste the URL here.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60 transition"
              >
                {submitting ? "Submitting…" : "Submit for Verification"}
              </button>
            </form>
          </div>
        )}

        {loading && <div className="h-24 animate-pulse rounded-xl bg-slate-100" />}
      </div>
    </DashboardLayout>
  );
}

export default Verification;
