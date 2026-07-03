import api from "./axios";

export const login = (email, password) =>
  api.post("/auth/login", { email, password });

export const verifyLoginOtp = (email, otp, tempToken) =>
  api.post("/auth/verify-login-otp", { email, otp, tempToken });

export const resendLoginOtp = (email, tempToken) =>
  api.post("/auth/request-login-otp", { email, tempToken });

export const requestForgotPasswordOtp = (email) =>
  api.post("/auth/forgot-password/request-otp", { email });

export const resetForgotPassword = (payload) =>
  api.post("/auth/forgot-password/reset", payload);

export const register = (body) => api.post("/auth/register", body);
