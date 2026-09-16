import api from "./api";

export const blockUser = (userId) => api.post(`/safety/blocks/${userId}`);
export const unblockUser = (userId) => api.delete(`/safety/blocks/${userId}`);
export const getBlockedUsers = () => api.get("/safety/blocks");
export const reportUser = (userId, data) => api.post(`/safety/reports/${userId}`, data);
