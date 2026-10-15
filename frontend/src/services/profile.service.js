import api from "./api";

export const createProfile = (data) => api.post("/profile", data);
export const getProfile = () => api.get("/profile");
export const updateProfile = (data) => api.patch("/profile", data);
export const deleteProfile = () => api.delete("/profile");
export const getPublicProfileById = (id) => api.get(`/profile/${id}`);
export const getProfileViews = () => api.get("/profile/views");
export const updateVisibility = (mode) => api.patch("/profile/visibility", { mode });

export const uploadProfilePicture = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/upload/profile-picture", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteProfilePicture = () => api.delete("/upload/profile-picture");
