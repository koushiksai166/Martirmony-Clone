import api from "./api";

export const searchProfiles = (params) => api.get("/profile/search", { params });
export const getPublicProfile = (id) => api.get(`/profile/${id}`);
