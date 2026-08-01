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