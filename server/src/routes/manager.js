// routes/manager.js
// Manager routes:
// 1) Team management (same department only)
// 2) Personal pages (attendance + leave + wfh)

import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import {
  ping,
  dashboardSummary,
  getEmployees,
  getAttendance,
  getLeaveRequests,
  getWfhRequests,
} from "../controllers/queries/managerQueries.js";
import {
  approveLeave,
  rejectLeave,
  approveWfh,
  rejectWfh,
} from "../controllers/commands/managerCommands.js";
import { getMyProfile } from "../controllers/queries/employeeQueries.js";
import {
  updateMyProfile,
  requestChangePasswordOtp,
  changeMyPassword,
} from "../controllers/commands/employeeCommands.js";
import { employeeAttendanceRouter } from "./attendanceRoutes.js";
import { employeeLeaveRouter } from "./leaveRoutes.js";
import { employeeWfhRouter } from "./wfhRoutes.js";
import { employeePayrollRouter } from "./payrollRoutes.js";
import { managerHolidayRouter } from "./holidayRoutes.js";
import { managerAnnouncementRouter } from "./announcementRoutes.js";
import { selfDocumentRouter } from "./documentRoutes.js";

import { uploadAvatar } from "../middleware/upload.js";

const router = express.Router();

router.get("/ping", ping);

router.use(protect);
router.use(requireRole("manager", "department_head", "project_manager"));

router.get("/dashboard-summary", dashboardSummary);
router.get("/profile", getMyProfile);
router.put("/profile", uploadAvatar, updateMyProfile);
router.post("/change-password/request-otp", requestChangePasswordOtp);
router.patch("/change-password", changeMyPassword);
router.get("/employees", getEmployees);
router.get("/attendance", getAttendance);
router.use("/my-attendance", employeeAttendanceRouter);
router.use("/my-leave", employeeLeaveRouter);
router.use("/my-wfh", employeeWfhRouter);
router.use("/my-payroll", employeePayrollRouter);
router.use("/holidays", managerHolidayRouter);
router.use("/announcements", managerAnnouncementRouter);
router.use("/documents", selfDocumentRouter);

router.get("/leave-requests", getLeaveRequests);
router.patch("/leave-requests/:id/approve", approveLeave);
router.patch("/leave-requests/:id/reject", rejectLeave);

router.get("/wfh-requests", getWfhRequests);
router.patch("/wfh-requests/:id/approve", approveWfh);
router.patch("/wfh-requests/:id/reject", rejectWfh);

export default router;
