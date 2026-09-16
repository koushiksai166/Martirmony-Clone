import api from "./api";

export const getAdminUsers = () => api.get("/admin/users");
export const getPendingProfiles = () => api.get("/admin/profiles/pending");
export const verifyProfile = (id) => api.patch(`/admin/profiles/${id}/verify`);
export const getReports = () => api.get("/admin/reports");
export const resolveReport = (id) => api.patch(`/admin/reports/${id}/resolve`);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
