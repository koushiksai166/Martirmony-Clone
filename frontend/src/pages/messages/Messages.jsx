import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Avatar from "../../components/ui/Avatar";
import { getConversations, getMessages, sendMessage } from "../../services/chat.service";
import { toast } from "react-toastify";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";

function Messages() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    getConversations()
      .then(({ data }) => { setConversations(data); if (data[0]) setActive(data[0]); })
      .catch(() => toast.error("Unable to load conversations"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (active) getMessages(active.id).then(({ data }) => setMessages(data)).catch(() => toast.error("Unable to load messages"));
  }, [active]);

  useEffect(() => {
    const activeSocket = socket.current;
    if (!activeSocket || !active) return undefined;
    activeSocket.emit("conversation:join", { conversationId: active.id });
    const receive = (message) => setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    activeSocket.on("message:new", receive);
    return () => activeSocket.off("message:new", receive);
  }, [active, socket]);

  const submit = async (event) => {
    event.preventDefault();
    if (!content.trim() || !active) return;
    try {
      if (socket.current?.connected) socket.current.emit("message:send", { conversationId: active.id, content });
      else { const { data } = await sendMessage(active.id, content); setMessages((current) => [...current, data]); }
      setContent("");
    } catch (error) { toast.error(error.response?.data?.message || "Unable to send message"); }
  };

  const other = (conversation) => conversation.firstUser?.profile || conversation.secondUser?.profile;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="mt-2 text-slate-600">Your conversations are persisted securely.</p>
        </div>
        {loading ? <div className="h-64 animate-pulse rounded-xl bg-slate-200" /> : (
          <div className="grid min-h-[28rem] overflow-hidden rounded-xl bg-white shadow-sm md:grid-cols-[16rem_1fr]">
            <aside className="border-b border-slate-100 p-4 md:border-b-0 md:border-r">
              <h2 className="font-semibold">Conversations</h2>
              {conversations.length ? conversations.map((item) => {
                const p = other(item);
                const name = p ? `${p.firstName} ${p.lastName}` : "Member";
                return (
                  <button key={item.id} onClick={() => setActive(item)} className={`mt-3 flex w-full items-center gap-3 rounded-lg p-3 text-left ${active?.id === item.id ? "bg-pink-50" : "hover:bg-slate-50"}`}>
                    <Avatar src={p?.profilePicture} name={name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{name}</p>
                      <p className="truncate text-xs text-slate-500">{item.messages?.[0]?.content || "No messages yet"}</p>
                    </div>
                  </button>
                );
              }) : <p className="mt-6 text-sm text-slate-500">No conversations yet.</p>}
            </aside>
            <section className="flex flex-col p-4">
              {active ? (
                <>
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs rounded-lg p-3 ${message.senderId === user?.id ? "bg-pink-600 text-white" : "bg-slate-50"}`}>
                          <p>{message.content}</p>
                          <time className={`mt-1 block text-xs ${message.senderId === user?.id ? "text-pink-200" : "text-slate-400"}`}>{new Date(message.createdAt).toLocaleString()}</time>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={submit} className="mt-4 flex gap-2">
                    <input value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} placeholder="Write a message" className="min-w-0 flex-1 rounded-lg border px-3 py-2.5" />
                    <button type="submit" className="rounded-lg bg-pink-600 px-4 py-2.5 text-white">Send</button>
                  </form>
                </>
              ) : <div className="flex flex-1 items-center justify-center text-slate-500">Select a conversation to begin.</div>}
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Messages;
