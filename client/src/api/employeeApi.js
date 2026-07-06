import api from "./axios";

const getBase = () => {
  const role = sessionStorage.getItem("role");
  return role === "manager" ? "/manager" : "/admin";
};

export const createEmployee = (data) => {
  const headers = data instanceof FormData
    ? { "Content-Type": "multipart/form-data" }
    : { "Content-Type": "application/json" };
  return api.post("/admin/employees", data, { headers });
};

export const getEmployees = (params = {}) =>
  api.get(`${getBase()}/employees`, {
    params: {
      search: params.search || "",
      status: params.status || "",
      role: params.role || "",
      department: params.department || "",
      page: String(params.page || 1),
      limit: String(params.limit || 20),
    },
  });

export const updateEmployee = (id, data) =>
  api.patch(`/admin/employees/${id}`, data);

export const deleteEmployee = (id, action) =>
  api.delete(`/admin/employees/${id}`, { data: { action } });

export const getEmployeeProfile = (id) =>
  api.get(`/admin/employees/${id}/profile`);
