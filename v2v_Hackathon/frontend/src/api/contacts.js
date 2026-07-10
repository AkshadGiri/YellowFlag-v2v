import apiClient from "./client";

export const getContacts = () =>
  apiClient.get("/contacts").then((res) => res.data.data);

export const addContact = (payload) =>
  apiClient.post("/contacts", payload).then((res) => res.data.data);

export const updateContact = (id, payload) =>
  apiClient.patch(`/contacts/${id}`, payload).then((res) => res.data.data);

export const deleteContact = (id) =>
  apiClient.delete(`/contacts/${id}`).then((res) => res.data.data);
