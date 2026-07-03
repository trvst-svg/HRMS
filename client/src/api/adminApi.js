import api from "./axios";

const getBase = () => {
  const role = sessionStorage.getItem("role");
  return role === "manager" ? "/manager" : "/admin";
};

export const getDashboardSummary = () =>
  api.get(`${getBase()}/dashboard-summary`);

export const getAnalytics = () => api.get(`${getBase()}/analytics`);

// Announcements
export const getAnnouncements = () => api.get(`${getBase()}/announcements`);

export const createAnnouncement = (payload) =>
  api.post(`${getBase()}/announcements`, payload);

export const deleteAnnouncement = (id) =>
  api.delete(`${getBase()}/announcements/${id}`);

// Holidays
export const getHolidays = () =>
  api.get(`${getBase()}/holidays?upcoming=false`);

export const createHoliday = (payload) =>
  api.post(`${getBase()}/holidays`, payload);

export const deleteHoliday = (id) => api.delete(`${getBase()}/holidays/${id}`);

// Departments
export const getDepartments = () =>
  api.get("/departments").catch(() => api.get("/admin/departments"));

export const createDepartment = (payload) =>
  api
    .post("/departments", payload)
    .catch(() => api.post("/admin/departments", payload));

export const deleteDepartment = (id) =>
  api
    .delete(`/departments/${id}`)
    .catch(() => api.delete(`/admin/departments/${id}`));
