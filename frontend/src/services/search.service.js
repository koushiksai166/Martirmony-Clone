import api from "./api";

export const searchProfiles = (params) => api.get("/profile/search", { params });
export const getPublicProfile = (id) => api.get(`/profile/${id}`);

export const saveSearch = (data) => api.post("/profile/saved-searches", data);
export const getSavedSearches = () => api.get("/profile/saved-searches");
export const deleteSavedSearch = (id) => api.delete(`/profile/saved-searches/${id}`);
export const toggleSavedSearchAlert = (id, alertEnabled) =>
  api.patch(`/profile/saved-searches/${id}/alert`, { alertEnabled });
