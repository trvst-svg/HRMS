import api from "./axios";

const getBase = () => {
  const role = sessionStorage.getItem("role");
  if (role === "admin") return "/admin";
  const isManager = role === "manager" || role === "project_manager" || role === "department_head";
  return isManager ? "/manager" : "/employee";
};

export const getMyProfile = () => api.get(`${getBase()}/profile`);

export const updateMyProfile = (payload) => {
  const headers = payload instanceof FormData
    ? { "Content-Type": "multipart/form-data" }
    : { "Content-Type": "application/json" };
  return api.put(`${getBase()}/profile`, payload, { headers });
};

export const changeMyPassword = (payload) =>
  api.patch(`${getBase()}/change-password`, payload);

export const requestChangePasswordOtp = () =>
  api.post(`${getBase()}/change-password/request-otp`, {});
