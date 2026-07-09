// routes/admin.js
// Main admin router. We keep it small and clean.

import express from "express";
const router = express.Router();

import {
  protect,
  requireRole,
  requireHRorAdmin,
} from "../middleware/auth.js";
import {
  ping,
  dashboardSummary,
  analytics,
} from "../controllers/queries/adminQueries.js";

import employeeRoutes from "./employeeRoutes.js";
import announcementRoutes from "./announcementRoutes.js";
import { adminAttendanceRouter, employeeAttendanceRouter } from "./attendanceRoutes.js";
import { adminLeaveRouter, employeeLeaveRouter } from "./leaveRoutes.js";
import { adminWfhRouter, employeeWfhRouter } from "./wfhRoutes.js";
import { adminPayrollRouter, employeePayrollRouter } from "./payrollRoutes.js";
import { adminHolidayRouter } from "./holidayRoutes.js";
import departmentRoutes from "./departmentRoutes.js";
import { adminDocumentRouter, selfDocumentRouter } from "./documentRoutes.js";

import { getMyProfile } from "../controllers/queries/employeeQueries.js";
import {
  updateMyProfile,
  requestChangePasswordOtp,
  changeMyPassword,
} from "../controllers/commands/employeeCommands.js";

import { uploadAvatar } from "../middleware/upload.js";

// Simple health check.
router.get("/ping", ping);

// All routes below need logged-in admin or HR department user.
router.use(protect);
router.use(requireHRorAdmin);

// Dashboard + analytics
router.get("/dashboard-summary", dashboardSummary);
router.get("/analytics", analytics);

// Admin Profile and Actions
router.get("/profile", getMyProfile);
router.put("/profile", uploadAvatar, updateMyProfile);
router.post("/change-password/request-otp", requestChangePasswordOtp);
router.patch("/change-password", changeMyPassword);

// Feature routes
router.use("/employees", employeeRoutes);
router.use("/attendance", adminAttendanceRouter);
router.use("/leave-requests", adminLeaveRouter);
router.use("/wfh-requests", adminWfhRouter);
router.use("/announcements", announcementRoutes);
router.use("/holidays", adminHolidayRouter);
router.use("/departments", departmentRoutes);
router.use("/payroll", adminPayrollRouter);
router.use("/document-requests", adminDocumentRouter);

// Admin Personal Employee Features
router.use("/my-attendance", employeeAttendanceRouter);
router.use("/my-leave", employeeLeaveRouter);
router.use("/my-wfh", employeeWfhRouter);
router.use("/my-payroll", employeePayrollRouter);
router.use("/my-documents", selfDocumentRouter);

export default router;
