import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { triggerPanic } from "../../services/safety.service";
import { toast } from "react-toastify";

function PanicButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let location = null;
      if (navigator.geolocation) {
        location = await new Promise((resolve) =>
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(`${pos.coords.latitude},${pos.coords.longitude}`),
            () => resolve(null),
            { timeout: 3000 }
          )
        );
      }
      await triggerPanic({ message: message || undefined, location });
      toast.error("🚨 Emergency alert sent. Stay safe.", { autoClose: 8000 });
      setOpen(false);
      setMessage("");
    } catch {
      toast.error("Failed to send alert. Please call emergency services directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Panic / Emergency"
        className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 active:scale-95 transition lg:bottom-8"
      >
        <AlertTriangle size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={20} />
                <h2 className="font-bold text-lg">Emergency Alert</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              This will immediately notify our safety team. Use only in genuine emergencies.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the situation (optional)..."
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition"
              >
                {loading ? "Sending alert…" : "🚨 Send Emergency Alert"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default PanicButton;
