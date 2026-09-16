import api from "./api";

export const register = (data) =>
  api.post("/auth/register", data);

export const login = (data) =>
  api.post("/auth/login", data);

export const getMe = () =>
  api.get("/auth/me");

export const changePassword = (data) =>
  api.patch("/auth/change-password", data);

export const refreshSession = (refreshToken) =>
  api.post("/auth/refresh", { refreshToken });

export const logoutSession = () => api.post("/auth/logout");