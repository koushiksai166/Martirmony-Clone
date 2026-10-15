import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  deleteNotification,
} from "../../services/notification.service";
import { useSocket } from "../../hooks/useSocket";

const TYPE_ICON = {
  NEW_INTEREST: "💌",
  INTEREST_ACCEPTED: "🎉",
  NEW_MESSAGE: "💬",
  NEW_MATCH: "✨",
  PROFILE_VERIFIED: "✅",
  PROFILE_VIEW: "👀",
  SYSTEM: "🔔",
};

function Notifications() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Connect to the /notifications namespace for real-time push
  const socket = useSocket("/notifications");

  const load = () =>
    getNotifications()
      .then(({ data }) => {
        setItems(data.items ?? data);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => toast.error("Unable to load notifications"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  // Real-time: prepend new notification pushed from server
  useEffect(() => {
    const sock = socket.current;
    if (!sock) return;

    const onNew = (notification) => {
      setItems((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
    };

    sock.on("notification:new", onNew);
    return () => sock.off("notification:new", onNew);
  }, [socket]);

  const mark = async (id) => {
    try {
      await markNotificationRead(id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const remove = async (id) => {
    try {
      await deleteNotification(id);
      const removed = items.find((i) => i.id === id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (removed && !removed.readAt) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-pink-600 px-2.5 py-0.5 text-sm font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={markAll}
            disabled={unreadCount === 0}
            className="text-sm font-medium text-pink-600 hover:text-pink-700 hover:underline disabled:opacity-40"
          >
            Mark all read
          </button>
        </div>

        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
        ) : (
          <section className="rounded-xl bg-white p-6 shadow-sm">
            {items.length ? (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className={`flex items-start gap-3 py-4 transition ${
                      item.readAt ? "opacity-60" : ""
                    }`}
                  >
                    <span className="mt-0.5 text-xl">
                      {TYPE_ICON[item.type] ?? "🔔"}
                    </span>

                    <button
                      type="button"
                      onClick={() => !item.readAt && mark(item.id)}
                      className="min-w-0 flex-1 text-left focus:outline-none"
                    >
                      <p className={`text-sm text-gray-800 ${!item.readAt ? "font-semibold" : ""}`}>
                        {item.message}
                      </p>
                      <time className="mt-1 block text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </time>
                    </button>

                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      className="ml-2 shrink-0 text-slate-400 hover:text-red-500 transition"
                      title="Delete"
                    >
                      ✕
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
