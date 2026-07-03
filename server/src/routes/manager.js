// routes/manager.js
// Manager routes:
// 1) Team management (same department only)
// 2) Personal pages (attendance + leave + wfh)

const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const {
  ping,
  dashboardSummary,
  getEmployees,
  getAttendance,
  getLeaveRequests,
  getWfhRequests,
} = require("../controllers/queries/managerQueries");
const {
  approveLeave,
  rejectLeave,
  approveWfh,
  rejectWfh,
} = require("../controllers/commands/managerCommands");
const { getMyProfile } = require("../controllers/queries/employeeQueries");
const {
  updateMyProfile,
  requestChangePasswordOtp,
  changeMyPassword,
} = require("../controllers/commands/employeeCommands");
const { employeeAttendanceRouter } = require("./attendanceRoutes");
const { employeeLeaveRouter } = require("./leaveRoutes");
const { employeeWfhRouter } = require("./wfhRoutes");
const { employeePayrollRouter } = require("./payrollRoutes");
const { managerHolidayRouter } = require("./holidayRoutes");
const { managerAnnouncementRouter } = require("./announcementRoutes");
const { selfDocumentRouter } = require("./documentRoutes");

const router = express.Router();

router.get("/ping", ping);

router.use(protect);
router.use(requireRole("manager", "department_head", "project_manager"));

router.get("/dashboard-summary", dashboardSummary);
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
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

module.exports = router;
