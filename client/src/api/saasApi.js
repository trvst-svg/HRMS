import api from "./axios";

export const checkInGps = (latitude, longitude) =>
  api.post("/saas/check-in-gps", { latitude, longitude });

export const getContracts = () => api.get("/saas/contracts");
export const issueContract = (payload) => api.post("/saas/contracts", payload);
export const signContract = (id, signatureData) =>
  api.post(`/saas/contracts/${id}/sign`, { signatureData });

export const getOkrs = () => api.get("/saas/okrs");
export const createOkr = (payload) => api.post("/saas/okrs", payload);
export const updateOkrProgress = (id, progress, feedback) =>
  api.put(`/saas/okrs/${id}/progress`, { progress, feedback });

export const getJobPostings = () => api.get("/saas/jobs");
export const createJobPosting = (payload) => api.post("/saas/jobs", payload);
export const applyJob = (id, payload) =>
  api.post(`/saas/jobs/${id}/apply`, payload);
export const getJobApplications = () => api.get("/saas/applications");
export const updateApplicationStatus = (id, status, feedback) =>
  api.put(`/saas/applications/${id}/status`, { status, feedback });

export const getShifts = () => api.get("/saas/shifts");
export const assignShift = (payload) => api.post("/saas/shifts", payload);
