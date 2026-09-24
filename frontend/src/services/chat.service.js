import api from "./api";

/**
 * Chat Service
 *
 * Provides REST API functions for 1-on-1 conversations and instant messaging.
 */

/**
 * Fetches all active conversations for the authenticated user.
 * @returns {Promise<AxiosResponse>} List of conversation objects with participant details and last messages
 */
export const getConversations = () => api.get("/chat/conversations");

/**
 * Fetches the message history for a specific conversation.
 * @param {string} conversationId - The ID of the conversation
 * @returns {Promise<AxiosResponse>} List of message objects
 */
export const getMessages = (conversationId) =>
  api.get(`/chat/conversations/${conversationId}/messages`);

/**
 * Sends a new text message in a conversation.
 * @param {string} conversationId - The ID of the target conversation
 * @param {string} content - Message text content
 * @returns {Promise<AxiosResponse>} Created message object
 */
export const sendMessage = (conversationId, content) =>
  api.post(`/chat/conversations/${conversationId}/messages`, { content });

/**
 * Initiates or retrieves an existing 1-on-1 conversation with another user.
 * @param {string} userId - ID of the user to start chatting with
 * @returns {Promise<AxiosResponse>} Conversation object
 */
export const createConversation = (userId) =>
  api.post(`/chat/conversations/${userId}`);

