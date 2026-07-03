import api from "./axios";

export const getEmployeeDashboardSummary = () =>
  api.get("/employee/dashboard-summary");

export const getEmployeeHolidays = () => api.get("/employee/holidays");
