import api from "./axios";

export const getAvailableManagers = () =>
  api.get("/projects/available-managers");
export const getAvailableEmployees = () =>
  api.get("/projects/available-employees");

export const getProjects = () => api.get("/projects");
export const createProject = (payload) => api.post("/projects", payload);

export const getProjectDetails = (id) => api.get(`/projects/${id}`);
export const updateDocumentation = (id, documentation) =>
  api.put(`/projects/${id}/documentation`, { documentation });
export const assignMembers = (id, employeeIds) =>
  api.post(`/projects/${id}/members`, { employeeIds });
export const createTask = (id, payload) =>
  api.post(`/projects/${id}/tasks`, payload);

export const getMyActiveTask = () => api.get("/projects/my/active-task");

export const requestReport = (id) =>
  api.post(`/projects/tasks/${id}/request-report`);
export const submitReport = (id, progressReport) =>
  api.post(`/projects/tasks/${id}/report`, { progressReport });
export const requestExtension = (id, days, reason) =>
  api.post(`/projects/tasks/${id}/request-extension`, { days, reason });
export const reviewExtension = (id, action) =>
  api.post(`/projects/tasks/${id}/review-extension`, { action });
export const requestTransfer = (id, reason) =>
  api.post(`/projects/tasks/${id}/request-transfer`, { reason });
export const reviewTransfer = (id, action) =>
  api.post(`/projects/tasks/${id}/review-transfer`, { action });
export const updateTaskStatus = (id, status) =>
  api.put(`/projects/tasks/${id}/status`, { status });
