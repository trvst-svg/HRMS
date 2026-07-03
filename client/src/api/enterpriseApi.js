import api from "./axios";

// Expenses API
export const submitExpenseClaim = (data) =>
  api.post("/enterprise/expenses", data);
export const getMyExpenses = () => api.get("/enterprise/expenses/my");
export const getAllExpenses = () => api.get("/enterprise/expenses");
export const reviewExpense = (id, data) =>
  api.patch(`/enterprise/expenses/${id}/review`, data);

// Assets API
export const createAsset = (data) => api.post("/enterprise/assets", data);
export const getAllAssets = () => api.get("/enterprise/assets");
export const getMyAssets = () => api.get("/enterprise/assets/my");
export const updateAsset = (id, data) =>
  api.patch(`/enterprise/assets/${id}`, data);

// Appraisals API
export const createReviewCycle = (data) =>
  api.post("/enterprise/reviews", data);
export const getAllReviews = () => api.get("/enterprise/reviews");
export const getMyReviews = () => api.get("/enterprise/reviews/my");
export const submitSelfReview = (id, data) =>
  api.patch(`/enterprise/reviews/${id}/self`, data);
export const submitManagerReview = (id, data) =>
  api.patch(`/enterprise/reviews/${id}/manager`, data);

// Meetings API
export const createMeeting = (data) => api.post("/enterprise/meetings", data);
export const getMeetings = () => api.get("/enterprise/meetings");
export const updateMeeting = (id, data) =>
  api.patch(`/enterprise/meetings/${id}`, data);
export const getHrEmployees = () => api.get("/enterprise/hr-employees");
