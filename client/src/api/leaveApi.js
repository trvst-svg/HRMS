import api from "./axios";

const getManageBase = () => {
  const role = sessionStorage.getItem("role");
  return role === "manager" ? "/manager" : "/admin";
};

const getSelfLeaveBase = () => {
  const role = sessionStorage.getItem("role");
  if (role === "admin") return "/admin/my-leave";
  return role === "manager" ? "/manager/my-leave" : "/employee/leave";
};

const getSelfWfhBase = () => {
  const role = sessionStorage.getItem("role");
  if (role === "admin") return "/admin/my-wfh";
  return role === "manager" ? "/manager/my-wfh" : "/employee/wfh";
};

// Self: Leave
export const createLeave = (request) => api.post(getSelfLeaveBase(), request);

export const getMyLeaveRequests = (type) => {
  const base = getSelfLeaveBase();
  const url = type ? `${base}?type=${type}` : base;
  return api.get(url);
};

// Self: WFH
export const createWfh = (request) => api.post(getSelfWfhBase(), request);
export const getMyWfhRequests = () => api.get(getSelfWfhBase());

// Approval: Leave
export const getAllLeaveRequests = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const qs = params.toString();
  return api.get(`${getManageBase()}/leave-requests${qs ? `?${qs}` : ""}`);
};

export const approveLeave = (id) =>
  api.patch(`${getManageBase()}/leave-requests/${id}/approve`, {});

export const rejectLeave = (id) =>
  api.patch(`${getManageBase()}/leave-requests/${id}/reject`, {});

// Approval: WFH
export const getAllWfhRequests = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const qs = params.toString();
  return api.get(`${getManageBase()}/wfh-requests${qs ? `?${qs}` : ""}`);
};

export const approveWfh = (id) =>
  api.patch(`${getManageBase()}/wfh-requests/${id}/approve`, {});

export const rejectWfh = (id) =>
  api.patch(`${getManageBase()}/wfh-requests/${id}/reject`, {});
