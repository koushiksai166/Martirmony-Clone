import api from "./api";

export const createProfile = (data) => {
  return api.post("/profile", data);
};

export const getProfile = () => {
  return api.get("/profile");
};

export const updateProfile = (data) => {
  return api.patch("/profile", data);
};

export const deleteProfile = () => {
  return api.delete("/profile");
};

export const uploadProfilePicture = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/upload/profile-picture", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteProfilePicture = () => {
  return api.delete("/upload/profile-picture");
};