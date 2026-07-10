import apiClient from "./client";

export const triggerSOS = (level, lat, lng) =>
  apiClient.post("/sos/trigger", { level, lat, lng }).then((res) => res.data.data);

export const updateSOSLocation = (id, lat, lng) =>
  apiClient.patch(`/sos/${id}/location`, { lat, lng }).then((res) => res.data.data);

export const escalateSOS = (id, level) =>
  apiClient.patch(`/sos/${id}/escalate`, { level }).then((res) => res.data.data);

export const resolveSOS = (id) =>
  apiClient.patch(`/sos/${id}/resolve`).then((res) => res.data.data);

export const getActiveSOS = () =>
  apiClient.get("/sos/active").then((res) => res.data.data);

export const getSOSHistory = () =>
  apiClient.get("/sos/history").then((res) => res.data.data);

export const uploadRecording = (id, file, type) => {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);
  return apiClient
    .post(`/sos/${id}/recording`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((res) => res.data.data);
};
