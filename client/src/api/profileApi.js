import api from "./axios";

const getBase = () => {
  const role = sessionStorage.getItem("role");
  if (role === "admin") return "/admin";
  return role === "manager" ? "/manager" : "/employee";
};

export const getMyProfile = () => api.get(`${getBase()}/profile`);

export const updateMyProfile = (payload) =>
  api.put(`${getBase()}/profile`, payload);

export const changeMyPassword = (payload) =>
  api.patch(`${getBase()}/change-password`, payload);

export const requestChangePasswordOtp = () =>
  api.post(`${getBase()}/change-password/request-otp`, {});
