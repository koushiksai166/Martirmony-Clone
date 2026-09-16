import api from "./api";

export const getPreferences = () => api.get("/preferences");
export const savePreferences = (data) => api.patch("/preferences", data);
