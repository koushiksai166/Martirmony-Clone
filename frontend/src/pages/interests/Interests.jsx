import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import Avatar from "../../components/ui/Avatar";
import { acceptInterest, getReceivedInterests, getSentInterests, rejectInterest, withdrawInterest } from "../../services/interest.service";

function Interests() {
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    try {
      const [sentResponse, receivedResponse] = await Promise.all([getSentInterests(), getReceivedInterests()]);
      setSent(sentResponse.data);
      setReceived(receivedResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load interests");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const action = async (id, request) => {
    setBusy(id);
    try { await request(id); await load(); toast.success("Interest updated"); }
    catch (error) { toast.error(error.response?.data?.message || "Unable to update interest"); }
    finally { setBusy(null); }
  };

  const card = (interest, profile, receiver) => (
    <li key={interest.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar src={profile?.profilePicture} name={`${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`} size="sm" />
        <div>
          <p className="font-semibold">{profile?.firstName} {profile?.lastName}</p>
          <p className="text-sm text-slate-500">{interest.status}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {receiver && interest.status === "PENDING" && (
          <>
            <button disabled={busy === interest.id} onClick={() => action(interest.id, acceptInterest)} className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white">Accept</button>
            <button disabled={busy === interest.id} onClick={() => action(interest.id, rejectInterest)} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600">Reject</button>
          </>
        )}
        {!receiver && interest.status === "PENDING" && (
          <button disabled={busy === interest.id} onClick={() => action(interest.id, withdrawInterest)} className="rounded-lg border px-3 py-2 text-sm">Withdraw</button>
        )}
      </div>
    </li>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Interests</h1>
        {loading ? <div className="h-64 animate-pulse rounded-xl bg-slate-200" /> : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Received</h2>
              <ul className="mt-3">{received.length ? received.map((item) => card(item, item.sender?.profile, true)) : <li className="py-8 text-center text-slate-500">No received interests.</li>}</ul>
            </section>
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Sent</h2>
              <ul className="mt-3">{sent.length ? sent.map((item) => card(item, item.receiver?.profile, false)) : <li className="py-8 text-center text-slate-500">No sent interests.</li>}</ul>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Interests;
