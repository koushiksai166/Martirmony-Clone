import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Avatar from "../../components/ui/Avatar";
import {
  getConversations,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
} from "../../services/chat.service";
import { toast } from "react-toastify";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";

function Messages() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const socket = useSocket();
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    getConversations()
      .then(({ data }) => {
        setConversations(data);
        if (data[0]) setActive(data[0]);
      })
      .catch(() => toast.error("Unable to load conversations"))
      .finally(() => setLoading(false));
  }, []);

  // ── Load history when active conversation changes ───────────────────────────
  useEffect(() => {
    if (active) {
      getMessages(active.id)
        .then(({ data }) => setMessages(data))
        .catch(() => toast.error("Unable to load messages"));
    }
  }, [active]);

  // ── Auto-scroll to bottom on new messages ──────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Socket event listeners ─────────────────────────────────────────────────
  useEffect(() => {
    const sock = socket.current;
    if (!sock || !active) return;

    sock.emit("conversation:join", { conversationId: active.id });

    const onNew = (msg) =>
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
      );

    const onDelivered = ({ messageId, deliveredAt }) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deliveredAt } : m))
      );

    const onRead = ({ readMessages }) =>
      setMessages((prev) =>
        prev.map((m) => {
          const found = readMessages.find((r) => r.id === m.id);
          return found ? { ...m, readAt: found.readAt } : m;
        })
      );

    const onUpdated = (msg) =>
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));

    const onDeleted = ({ messageId, deletedAt }) =>
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, deletedAt, content: null } : m
        )
      );

    const onTypingStart = ({ userId: uid }) => {
      if (uid !== user?.id)
        setTypingUsers((prev) => new Set([...prev, uid]));
    };

    const onTypingStop = ({ userId: uid }) =>
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });

    const onUserOnline = ({ userId: uid }) =>
      setOnlineUsers((prev) => new Set([...prev, uid]));

    const onUserOffline = ({ userId: uid }) =>
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(uid);
        return next;
      });

    sock.on("message:new", onNew);
    sock.on("message:delivered", onDelivered);
    sock.on("message:read", onRead);
    sock.on("message:updated", onUpdated);
    sock.on("message:deleted", onDeleted);
    sock.on("typing:start", onTypingStart);
    sock.on("typing:stop", onTypingStop);
    sock.on("user:online", onUserOnline);
    sock.on("user:offline", onUserOffline);

    return () => {
      sock.off("message:new", onNew);
      sock.off("message:delivered", onDelivered);
      sock.off("message:read", onRead);
      sock.off("message:updated", onUpdated);
      sock.off("message:deleted", onDeleted);
      sock.off("typing:start", onTypingStart);
      sock.off("typing:stop", onTypingStop);
      sock.off("user:online", onUserOnline);
      sock.off("user:offline", onUserOffline);
    };
  }, [active, socket, user?.id]);

  // ── Typing indicator emission ──────────────────────────────────────────────
  const handleTyping = (e) => {
    setContent(e.target.value);
    const sock = socket.current;
    if (!sock?.connected || !active) return;

    sock.emit("typing:start", { conversationId: active.id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      sock.emit("typing:stop", { conversationId: active.id });
    }, 1500);
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() || !active) return;

    clearTimeout(typingTimer.current);
    socket.current?.emit("typing:stop", { conversationId: active.id });

    try {
      if (socket.current?.connected) {
        socket.current.emit("message:send", {
          conversationId: active.id,
          content,
        });
      } else {
        const { data } = await sendMessage(active.id, content);
        setMessages((prev) => [...prev, data]);
      }
      setContent("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to send message");
    }
  };

  // ── Edit message ───────────────────────────────────────────────────────────
  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    try {
      if (socket.current?.connected) {
        socket.current.emit("message:edit", {
          messageId: editingId,
          content: editContent,
        });
      } else {
        const { data } = await editMessage(editingId, editContent);
        setMessages((prev) => prev.map((m) => (m.id === data.id ? data : m)));
      }
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to edit message");
    }
  };

  // ── Delete message ─────────────────────────────────────────────────────────
  const handleDelete = async (messageId) => {
    try {
      if (socket.current?.connected) {
        socket.current.emit("message:delete", { messageId });
      } else {
        await deleteMessage(messageId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, deletedAt: new Date().toISOString(), content: null }
              : m
          )
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete message");
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const other = (conv) => {
    const profile =
      conv.firstUser?.id === user?.id
        ? conv.secondUser?.profile
        : conv.firstUser?.profile;
    return profile;
  };

  const otherUserId = (conv) =>
    conv.firstUser?.id === user?.id ? conv.secondUser?.id : conv.firstUser?.id;

  const statusIcon = (msg) => {
    if (msg.senderId !== user?.id) return null;
    if (msg.readAt) return <span className="text-blue-300 text-xs ml-1">✓✓</span>;
    if (msg.deliveredAt) return <span className="text-pink-200 text-xs ml-1">✓✓</span>;
    return <span className="text-pink-300 text-xs ml-1">✓</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="mt-2 text-slate-600">Your conversations are persisted securely.</p>
        </div>

        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
        ) : (
          <div className="grid min-h-[28rem] overflow-hidden rounded-xl bg-white shadow-sm md:grid-cols-[16rem_1fr]">
            {/* Sidebar */}
            <aside className="border-b border-slate-100 p-4 md:border-b-0 md:border-r">
              <h2 className="font-semibold mb-2">Conversations</h2>
              {conversations.length ? (
                conversations.map((item) => {
                  const p = other(item);
                  const name = p ? `${p.firstName} ${p.lastName}` : "Member";
                  const isOnline = onlineUsers.has(otherUserId(item));
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActive(item)}
                      className={`mt-2 flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${
                        active?.id === item.id ? "bg-pink-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="relative">
                        <Avatar src={p?.profilePicture} name={name} size="sm" />
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {item.messages?.[0]?.content || "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="mt-6 text-sm text-slate-500">No conversations yet.</p>
              )}
            </aside>

            {/* Chat pane */}
            <section className="flex flex-col p-4">
              {active ? (
                <>
                  {/* Online status header */}
                  {(() => {
                    const p = other(active);
                    const name = p ? `${p.firstName} ${p.lastName}` : "Member";
                    const isOnline = onlineUsers.has(otherUserId(active));
                    return (
                      <div className="mb-3 flex items-center gap-2 border-b pb-3">
                        <div className="relative">
                          <Avatar src={p?.profilePicture} name={name} size="sm" />
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{name}</p>
                          <p className={`text-xs ${isOnline ? "text-green-500" : "text-slate-400"}`}>
                            {isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Message feed */}
                  <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[22rem]">
                    {messages.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex group ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`relative max-w-xs rounded-lg p-3 ${
                              isMine ? "bg-pink-600 text-white" : "bg-slate-50"
                            }`}
                          >
                            {msg.deletedAt ? (
                              <p className="text-sm italic opacity-60">Message deleted</p>
                            ) : editingId === msg.id ? (
                              <form onSubmit={submitEdit} className="flex gap-1">
                                <input
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="rounded border px-2 py-1 text-sm text-slate-900"
                                  autoFocus
                                />
                                <button type="submit" className="text-xs underline">Save</button>
                                <button type="button" onClick={() => setEditingId(null)} className="text-xs underline">Cancel</button>
                              </form>
                            ) : (
                              <p className="text-sm">{msg.content}</p>
                            )}

                            <div className="mt-1 flex items-center justify-end gap-1">
                              <time className={`text-xs ${isMine ? "text-pink-200" : "text-slate-400"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </time>
                              {msg.editedAt && !msg.deletedAt && (
                                <span className={`text-xs ${isMine ? "text-pink-200" : "text-slate-400"}`}>(edited)</span>
                              )}
                              {statusIcon(msg)}
                            </div>

                            {/* Edit / Delete actions (own messages only) */}
                            {isMine && !msg.deletedAt && (
                              <div className="absolute -top-6 right-0 hidden group-hover:flex gap-1 bg-white border rounded shadow px-1 py-0.5">
                                <button
                                  onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}
                                  className="text-xs text-slate-600 hover:text-pink-600 px-1"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(msg.id)}
                                  className="text-xs text-slate-600 hover:text-red-600 px-1"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing indicator */}
                    {typingUsers.size > 0 && (
                      <div className="flex justify-start">
                        <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-500 italic">
                          typing…
                        </div>
                      </div>
                    )}

                    <div ref={bottomRef} />
                  </div>

                  {/* Composer */}
                  <form onSubmit={submit} className="mt-4 flex gap-2">
                    <input
                      value={content}
                      onChange={handleTyping}
                      maxLength={2000}
                      placeholder="Write a message..."
                      className="min-w-0 flex-1 rounded-lg border px-3 py-2.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-pink-600 hover:bg-pink-700 px-4 py-2.5 text-sm text-white font-medium transition"
                    >
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-slate-500">
                  Select a conversation to begin.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Messages;
