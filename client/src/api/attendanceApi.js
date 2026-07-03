import api from "./axios";

const getManageBase = () => {
  const role = sessionStorage.getItem("role");
  return role === "manager" ? "/manager" : "/admin";
};

const getSelfBase = () => {
  const role = sessionStorage.getItem("role");
  if (role === "admin") return "/admin/my-attendance";
  return role === "manager" ? "/manager/my-attendance" : "/employee/attendance";
};

// Self
export const checkIn = () => api.post(`${getSelfBase()}/check-in`, {});
export const checkOut = () => api.post(`${getSelfBase()}/check-out`, {});

export const getMyAttendance = (from, to) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return api.get(getSelfBase(), { params });
};

// Admin/Manager team
export const getAllAttendance = (filters = {}) => {
  const params = {};
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.employeeId) params.employeeId = filters.employeeId;
  if (filters.role) params.role = filters.role;
  if (filters.status) params.status = filters.status;
  return api.get(`${getManageBase()}/attendance`, { params });
};
