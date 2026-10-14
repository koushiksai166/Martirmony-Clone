import api from "./api";

export const getConversations = () => api.get("/chat/conversations");

export const getMessages = (conversationId) =>
  api.get(`/chat/conversations/${conversationId}/messages`);

export const sendMessage = (conversationId, content) =>
  api.post(`/chat/conversations/${conversationId}/messages`, { content });

export const createConversation = (userId) =>
  api.post(`/chat/conversations/${userId}`);

export const markConversationRead = (conversationId) =>
  api.patch(`/chat/conversations/${conversationId}/read`);

export const editMessage = (messageId, content) =>
  api.patch(`/chat/messages/${messageId}`, { content });

export const deleteMessage = (messageId) =>
  api.delete(`/chat/messages/${messageId}`);
