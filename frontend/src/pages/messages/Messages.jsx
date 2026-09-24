import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Avatar from "../../components/ui/Avatar";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "../../services/chat.service";
import { toast } from "react-toastify";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";

/**
 * Messages (Chat) Page Component
 *
 * Real-time 1-on-1 instant messaging interface:
 * - Left pane: Conversation thread list displaying counter-party avatars, names, and latest preview snippet.
 * - Right pane: Active message bubble feed with auto-scroll and send message form.
 * - Real-time Socket.io integration:
 *   - Joins room on conversation selection (`conversation:join`).
 *   - Listens for incoming real-time messages (`message:new`).
 *   - Sends messages over WebSocket with fallback to REST API (`/chat/conversations/:id/messages`).
 */
function Messages() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  // WebSocket hook
  const socket = useSocket();
  const { user } = useAuth();

  // 1. Fetch initial conversations list on mount
  useEffect(() => {
    getConversations()
      .then(({ data }) => {
        setConversations(data);
        if (data[0]) setActive(data[0]);
      })
      .catch(() => toast.error("Unable to load conversations"))
      .finally(() => setLoading(false));
  }, []);

  // 2. Fetch historical message logs when active conversation changes
  useEffect(() => {
    if (active) {
      getMessages(active.id)
        .then(({ data }) => setMessages(data))
        .catch(() => toast.error("Unable to load messages"));
    }
  }, [active]);

  // 3. Join active conversation room and listen for real-time messages
  useEffect(() => {
    const activeSocket = socket.current;
    if (!activeSocket || !active) return undefined;

    // Join room
    activeSocket.emit("conversation:join", { conversationId: active.id });

    // Handle incoming real-time message event
    const receive = (message) => {
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message]
      );
    };

    activeSocket.on("message:new", receive);

    // Cleanup: Remove listener when changing room or unmounting
    return () => {
      activeSocket.off("message:new", receive);
    };
  }, [active, socket]);

  /**
   * Dispatches new text message via Socket.io or REST fallback
   */
  const submit = async (event) => {
    event.preventDefault();
    if (!content.trim() || !active) return;

    try {
      if (socket.current?.connected) {
        // Send via WebSocket
        socket.current.emit("message:send", {
          conversationId: active.id,
          content,
        });
      } else {
        // Fallback to REST API
        const { data } = await sendMessage(active.id, content);
        setMessages((current) => [...current, data]);
      }
      setContent("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send message");
    }
  };

  /**
   * Helper extracting the other participant's profile from a conversation object
   */
  const other = (conversation) =>
    conversation.firstUser?.profile || conversation.secondUser?.profile;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="mt-2 text-slate-600">
            Your conversations are persisted securely.
          </p>
        </div>

        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
        ) : (
          <div className="grid min-h-[28rem] overflow-hidden rounded-xl bg-white shadow-sm md:grid-cols-[16rem_1fr]">
            {/* Sidebar: Conversation List */}
            <aside className="border-b border-slate-100 p-4 md:border-b-0 md:border-r">
              <h2 className="font-semibold mb-2">Conversations</h2>
              {conversations.length ? (
                conversations.map((item) => {
                  const p = other(item);
                  const name = p ? `${p.firstName} ${p.lastName}` : "Member";
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActive(item)}
                      className={`mt-2 flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${
                        active?.id === item.id
                          ? "bg-pink-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <Avatar src={p?.profilePicture} name={name} size="sm" />
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
                <p className="mt-6 text-sm text-slate-500">
                  No conversations yet.
                </p>
              )}
            </aside>

            {/* Main Chat Feed & Message Composer */}
            <section className="flex flex-col p-4">
              {active ? (
                <>
                  {/* Message Bubble Feed */}
                  <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[26rem]">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === user?.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs rounded-lg p-3 ${
                            message.senderId === user?.id
                              ? "bg-pink-600 text-white"
                              : "bg-slate-50"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <time
                            className={`mt-1 block text-xs ${
                              message.senderId === user?.id
                                ? "text-pink-200"
                                : "text-slate-400"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleString()}
                          </time>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Composer Input Form */}
                  <form onSubmit={submit} className="mt-4 flex gap-2">
                    <input
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
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

