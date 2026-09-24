import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import Avatar from "../../components/ui/Avatar";
import {
  acceptInterest,
  getReceivedInterests,
  getSentInterests,
  rejectInterest,
  withdrawInterest,
} from "../../services/interest.service";

/**
 * Interests Page Component
 *
 * Manages two-way connection requests (expressions of interest):
 * - Received Interests: Requests sent by other members to the user (can Accept or Reject).
 * - Sent Interests: Requests sent by the user to other profiles (can Withdraw if still PENDING).
 * - Updates local state and displays visual feedback upon every action.
 */
function Interests() {
  // State variables for sent & received interests arrays
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tracks the ID of an interest currently undergoing an async action (e.g. accepting)
  const [busy, setBusy] = useState(null);

  /**
   * Fetches both sent and received interest lists in parallel
   */
  const load = async () => {
    try {
      const [sentResponse, receivedResponse] = await Promise.all([
        getSentInterests(),
        getReceivedInterests(),
      ]);
      setSent(sentResponse.data);
      setReceived(receivedResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load interests");
    } finally {
      setLoading(false);
    }
  };

  // Load interests on component mount
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    load();
  }, []);

  /**
   * Helper function to execute interest status changes
   * @param {string} id - The ID of the interest record
   * @param {Function} request - Async interest API call function
   */
  const action = async (id, request) => {
    setBusy(id);
    try {
      await request(id);
      await load();
      toast.success("Interest updated");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update interest"
      );
    } finally {
      setBusy(null);
    }
  };

  /**
   * Renders an individual interest row item
   * @param {object} interest - Interest record object
   * @param {object} profile - Profile of the counterpart member
   * @param {boolean} receiver - True if rendering in Received section, false if Sent
   */
  const card = (interest, profile, receiver) => (
    <li
      key={interest.id}
      className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0"
    >
      {/* Profile info: Avatar, Name, and Status */}
      <div className="flex items-center gap-3">
        <Avatar
          src={profile?.profilePicture}
          name={`${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`}
          size="sm"
        />
        <div>
          <p className="font-semibold">
            {profile?.firstName} {profile?.lastName}
          </p>
          <p className="text-sm text-slate-500 font-medium">
            Status: {interest.status}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {/* Actions for Received Interests */}
        {receiver && interest.status === "PENDING" && (
          <>
            <button
              disabled={busy === interest.id}
              onClick={() => action(interest.id, acceptInterest)}
              className="rounded-lg bg-green-600 hover:bg-green-700 px-3 py-2 text-sm text-white font-medium disabled:opacity-50 transition"
            >
              Accept
            </button>
            <button
              disabled={busy === interest.id}
              onClick={() => action(interest.id, rejectInterest)}
              className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 font-medium disabled:opacity-50 transition"
            >
              Reject
            </button>
          </>
        )}

        {/* Action for Sent Interests */}
        {!receiver && interest.status === "PENDING" && (
          <button
            disabled={busy === interest.id}
            onClick={() => action(interest.id, withdrawInterest)}
            className="rounded-lg border border-slate-300 hover:bg-slate-50 px-3 py-2 text-sm font-medium disabled:opacity-50 transition"
          >
            Withdraw
          </button>
        )}
      </div>
    </li>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Interests</h1>

        {/* Loading placeholder skeleton */}
        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Received Interests Column */}
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Received</h2>
              <ul className="mt-3">
                {received.length ? (
                  received.map((item) =>
                    card(item, item.sender?.profile, true)
                  )
                ) : (
                  <li className="py-8 text-center text-slate-500">
                    No received interests.
                  </li>
                )}
              </ul>
            </section>

            {/* Sent Interests Column */}
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Sent</h2>
              <ul className="mt-3">
                {sent.length ? (
                  sent.map((item) =>
                    card(item, item.receiver?.profile, false)
                  )
                ) : (
                  <li className="py-8 text-center text-slate-500">
                    No sent interests.
                  </li>
                )}
              </ul>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Interests;

