import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notification.service";

/**
 * Notifications Page Component
 *
 * Feed of user alerts and activity notifications:
 * - Fetches system, interest, and chat message notification items.
 * - Allows marking individual notifications as read by clicking.
 * - Supports bulk "Mark all read" action.
 * - Visually differentiates unread from read notifications using opacity styling.
 */
function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Loads notifications list from server
   */
  const load = () =>
    getNotifications()
      .then(({ data }) => setItems(data))
      .catch(() => toast.error("Unable to load notifications"))
      .finally(() => setLoading(false));

  // Fetch notifications on mount
  useEffect(() => {
    load();
  }, []);

  /**
   * Marks a single notification as read and updates local state optimistically
   * @param {string} id - The ID of the notification item
   */
  const mark = async (id) => {
    try {
      await markNotificationRead(id);
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item
        )
      );
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  /**
   * Marks all notifications as read in bulk
   */
  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((current) =>
        current.map((item) => ({ ...item, readAt: new Date().toISOString() }))
      );
    } catch {
      toast.error("Failed to mark all notifications as read");
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header with Title and Mark All Read CTA */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <button
            type="button"
            onClick={markAll}
            className="text-sm font-medium text-pink-600 hover:text-pink-700 hover:underline"
          >
            Mark all read
          </button>
        </div>

        {/* Notification List Container */}
        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
        ) : (
          <section className="rounded-xl bg-white p-6 shadow-sm">
            {items.length ? (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={`py-4 transition ${
                      item.readAt ? "opacity-60" : "font-semibold"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => !item.readAt && mark(item.id)}
                      className="w-full text-left focus:outline-none"
                    >
                      <p className="font-medium text-gray-800">
                        {item.message}
                      </p>
                      <time className="mt-1 block text-xs text-slate-500 font-normal">
                        {new Date(item.createdAt).toLocaleString()}
                      </time>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-slate-500">
                You have no notifications.
              </p>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Notifications;

