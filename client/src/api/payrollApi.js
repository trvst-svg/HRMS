import api from "./axios";

const getMyBase = () => {
  const role = sessionStorage.getItem("role");
  if (role === "admin") return "/admin/my-payroll";
  return role === "manager" ? "/manager/my-payroll" : "/employee/payroll";
};

export const getMyPayrolls = () => api.get(getMyBase());

export const getAdminPayrolls = (filters = {}) =>
  api.get("/admin/payroll", {
    params: { month: filters.month || "", search: filters.search || "" },
  });

export const createOrUpdatePayroll = (payload) =>
  api.post("/admin/payroll", payload);

export const getTaxConfig = () => api.get("/admin/payroll/tax-config");

export const calculatePayroll = (payload) =>
  api.post("/admin/payroll/calculate", payload);

export const getAdminPayrollHtml = (id) => api.get(`/admin/payroll/${id}/html`);

export const downloadAdminPayrollPdf = (id) =>
  api.get(`/admin/payroll/${id}/download`, { responseType: "blob" });

export const getMyPayrollHtml = (id) => api.get(`${getMyBase()}/${id}/html`);

export const downloadMyPayrollPdf = (id) =>
  api.get(`${getMyBase()}/${id}/download`, { responseType: "blob" });
