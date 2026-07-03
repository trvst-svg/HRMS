import api from "./axios";

const getSelfBase = () => {
  const role = sessionStorage.getItem("role");
  if (role === "admin") return "/admin/my-documents";
  return role === "manager" ? "/manager/documents" : "/employee/documents";
};

const getAdminBase = () => "/admin/document-requests";

// Self
export const createMyRequest = (payload) => api.post(getSelfBase(), payload);

export const getMyRequests = () => api.get(getSelfBase());

export const viewMyApprovedDocument = (id) =>
  api.get(`${getSelfBase()}/${id}/view`);

export const downloadMyApprovedDocument = (id) =>
  api.get(`${getSelfBase()}/${id}/download`, { responseType: "blob" });

// Admin
export const getAdminRequests = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.role) qs.set("role", params.role);
  if (params.search) qs.set("search", params.search);
  const str = qs.toString();
  return api.get(`${getAdminBase()}${str ? `?${str}` : ""}`);
};

export const approveRequest = (id) =>
  api.patch(`${getAdminBase()}/${id}/approve`, {});

export const rejectRequest = (id, reason) =>
  api.patch(`${getAdminBase()}/${id}/reject`, { reason });

export const viewApprovedDocument = (id) =>
  api.get(`${getAdminBase()}/${id}/view`);

export const downloadApprovedDocument = (id) =>
  api.get(`${getAdminBase()}/${id}/download`, { responseType: "blob" });
