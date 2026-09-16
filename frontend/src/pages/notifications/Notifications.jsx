import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../../services/notification.service";

function Notifications() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const load = () => getNotifications().then(({ data }) => setItems(data)).catch(() => toast.error("Unable to load notifications")).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const mark = async (id) => { await markNotificationRead(id); setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: new Date().toISOString() } : item)); };
  const markAll = async () => { await markAllNotificationsRead(); setItems((current) => current.map((item) => ({ ...item, readAt: new Date().toISOString() }))); };
  return <DashboardLayout><div className="mx-auto max-w-3xl space-y-6"><div className="flex items-center justify-between"><h1 className="text-3xl font-bold">Notifications</h1><button type="button" onClick={markAll} className="text-sm font-medium text-pink-600">Mark all read</button></div>{loading ? <div className="h-64 animate-pulse rounded-xl bg-slate-200" /> : <section className="rounded-xl bg-white p-6 shadow-sm">{items.length ? <ul>{items.map((item) => <li key={item.id} className={`border-b border-slate-100 py-4 last:border-0 ${item.readAt ? "opacity-60" : ""}`}><button type="button" onClick={() => !item.readAt && mark(item.id)} className="w-full text-left"><p className="font-medium">{item.message}</p><time className="mt-1 block text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</time></button></li>)}</ul> : <p className="py-8 text-center text-slate-500">You have no notifications.</p>}</section>}</div></DashboardLayout>;
}
export default Notifications;
