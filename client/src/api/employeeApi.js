import api from "./axios";

const getBase = () => {
  const role = sessionStorage.getItem("role");
  return role === "manager" ? "/manager" : "/admin";
};

export const createEmployee = (data) => api.post("/admin/employees", data);

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
