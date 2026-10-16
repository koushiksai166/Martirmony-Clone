import api from "./api";

// ── Block / Unblock ──────────────────────────────────────────────────────────
export const blockUser = (userId) => api.post(`/safety/blocks/${userId}`);
export const unblockUser = (userId) => api.delete(`/safety/blocks/${userId}`);
export const getBlockedUsers = () => api.get("/safety/blocks");

// ── Reports ──────────────────────────────────────────────────────────────────
export const reportUser = (userId, data) => api.post(`/safety/reports/${userId}`, data);

// ── Panic Button ─────────────────────────────────────────────────────────────
export const triggerPanic = (data) => api.post("/safety/panic", data);
export const getPanicAlerts = () => api.get("/safety/panic");

// ── Background Verification ──────────────────────────────────────────────────
export const requestVerification = (data) => api.post("/safety/verification", data);
export const getVerificationStatus = () => api.get("/safety/verification");

// ── Family Linking ───────────────────────────────────────────────────────────
export const requestFamilyLink = (data) => api.post("/safety/family", data);
export const getFamilyLinks = () => api.get("/safety/family");
export const respondFamilyLink = (linkId, accept) => api.patch(`/safety/family/${linkId}`, { accept });
export const removeFamilyLink = (linkId) => api.delete(`/safety/family/${linkId}`);

// ── Video Call ────────────────────────────────────────────────────────────────
export const getVideoToken = (conversationId) => api.post(`/safety/video-token/${conversationId}`);
