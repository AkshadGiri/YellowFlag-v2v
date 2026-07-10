import apiClient from "./client";

export const registerUser = (payload) =>
  apiClient.post("/auth/register", payload).then((res) => res.data.data);

export const loginUser = (payload) =>
  apiClient.post("/auth/login", payload).then((res) => res.data.data);

export const getMe = () => apiClient.get("/auth/me").then((res) => res.data.data);

export const updateMyLocation = (lat, lng) =>
  apiClient.patch("/auth/location", { lat, lng }).then((res) => res.data.data);
