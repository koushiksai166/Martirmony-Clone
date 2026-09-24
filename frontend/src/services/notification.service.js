import api from "./api";

/**
 * Notification Service
 *
 * Provides API functions for reading and updating user notification alerts.
 */

/**
 * Fetches all notifications (interests, chat messages, profile views, system alerts) for the user.
 * @returns {Promise<AxiosResponse>} Array of notification objects
 */
export const getNotifications = () => api.get("/notifications");

/**
 * Marks a specific notification as read by ID.
 * @param {string} id - The ID of the notification
 * @returns {Promise<AxiosResponse>} Updated notification object
 */
export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`);

/**
 * Marks all unread notifications as read in bulk.
 * @returns {Promise<AxiosResponse>} Bulk update confirmation
 */
export const markAllNotificationsRead = () =>
  api.patch("/notifications/read-all");

