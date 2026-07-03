// routes/admin.js
// Main admin router. We keep it small and clean.

const express = require("express");
const router = express.Router();

const {
  protect,
  requireRole,
  requireHRorAdmin,
} = require("../middleware/auth");
const {
  ping,
  dashboardSummary,
  analytics,
} = require("../controllers/queries/adminQueries");

const employeeRoutes = require("./employeeRoutes");
const announcementRoutes = require("./announcementRoutes");
const { adminAttendanceRouter, employeeAttendanceRouter } = require("./attendanceRoutes");
const { adminLeaveRouter, employeeLeaveRouter } = require("./leaveRoutes");
const { adminWfhRouter, employeeWfhRouter } = require("./wfhRoutes");
const { adminPayrollRouter, employeePayrollRouter } = require("./payrollRoutes");
const { adminHolidayRouter } = require("./holidayRoutes");
const departmentRoutes = require("./departmentRoutes");
const { adminDocumentRouter, selfDocumentRouter } = require("./documentRoutes");

const { getMyProfile } = require("../controllers/queries/employeeQueries");
const {
  updateMyProfile,
  requestChangePasswordOtp,
  changeMyPassword,
} = require("../controllers/commands/employeeCommands");

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
router.put("/profile", updateMyProfile);
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

module.exports = router;
