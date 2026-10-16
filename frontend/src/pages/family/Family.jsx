import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Avatar from "../../components/ui/Avatar";
import {
  getFamilyLinks,
  requestFamilyLink,
  respondFamilyLink,
  removeFamilyLink,
} from "../../services/safety.service";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { UserPlus, Trash2, Check, X } from "lucide-react";

const RELATIONS = ["Father", "Mother", "Brother", "Sister", "Guardian", "Other"];

function Family() {
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetId, setTargetId] = useState("");
  const [relation, setRelation] = useState("Father");
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    getFamilyLinks()
      .then(({ data }) => setLinks(data))
      .catch(() => toast.error("Unable to load family links"))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!targetId.trim()) return;
    setSubmitting(true);
    try {
      await requestFamilyLink({ targetId: targetId.trim(), relation });
      toast.success("Family link request sent");
      setTargetId("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (linkId, accept) => {
    try {
      await respondFamilyLink(linkId, accept);
      toast.success(accept ? "Link accepted" : "Link rejected");
      load();
    } catch {
      toast.error("Failed to respond");
    }
  };

  const handleRemove = async (linkId) => {
    try {
      await removeFamilyLink(linkId);
      toast.success("Family link removed");
      load();
    } catch {
      toast.error("Failed to remove link");
    }
  };

  const getName = (u) =>
    u?.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u?.email || "Member";

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">Family Account Linking</h1>
          <p className="mt-2 text-slate-600">
            Allow a parent or guardian to co-manage your profile.
          </p>
        </div>

        {/* Send request form */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <UserPlus size={18} /> Link a Family Member
          </h2>
          <form onSubmit={handleRequest} className="space-y-3">
            <input
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Enter their User ID"
              className="w-full rounded-lg border px-3 py-2.5 text-sm"
              required
            />
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full rounded-lg border px-3 py-2.5 text-sm"
            >
              {RELATIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60 transition"
            >
              {submitting ? "Sending…" : "Send Request"}
            </button>
          </form>
        </div>

        {/* Links list */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">My Family Links</h2>
          </div>
          {loading ? (
            <div className="h-24 animate-pulse bg-slate-100 m-4 rounded-lg" />
          ) : links.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">No family links yet.</p>
          ) : (
            <ul className="divide-y">
              {links.map((link) => {
                const isRequester = link.requesterId === user?.id;
                const other = isRequester ? link.target : link.requester;
                const name = getName(other);
                const isPending = link.status === "PENDING";
                const isIncoming = !isRequester && isPending;

                return (
                  <li key={link.id} className="flex items-center gap-4 px-6 py-4">
                    <Avatar src={other?.profile?.profilePicture} name={name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{name}</p>
                      <p className="text-xs text-slate-500">
                        {link.relation} · {link.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isIncoming && (
                        <>
                          <button
                            onClick={() => handleRespond(link.id, true)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => handleRespond(link.id, false)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                          >
                            <X size={15} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleRemove(link.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Family;
