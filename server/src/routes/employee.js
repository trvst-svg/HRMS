// routes/employee.js
// Main employee router. Simple + readable.

const express = require("express");
const router = express.Router();

const { protect, requireRole } = require("../middleware/auth");
const {
  getEmployeeDashboardSummary,
  getMyProfile,
} = require("../controllers/queries/employeeQueries");
const {
  updateMyProfile,
  requestChangePasswordOtp,
  changeMyPassword,
} = require("../controllers/commands/employeeCommands");
const { employeeAttendanceRouter } = require("./attendanceRoutes");
const { employeeLeaveRouter } = require("./leaveRoutes");
const { employeeWfhRouter } = require("./wfhRoutes");
const { employeePayrollRouter } = require("./payrollRoutes");
const { employeeHolidayRouter } = require("./holidayRoutes");
const { selfDocumentRouter } = require("./documentRoutes");

// All employee routes need auth + employee role.
router.use(protect);
router.use(requireRole("employee"));

router.get("/ping", (req, res) => {
  res.json({ message: "Employee routes working", user: req.user.email });
});

router.get("/dashboard-summary", getEmployeeDashboardSummary);
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.post("/change-password/request-otp", requestChangePasswordOtp);
router.patch("/change-password", changeMyPassword);

// Feature routes
router.use("/attendance", employeeAttendanceRouter);
router.use("/leave", employeeLeaveRouter);
router.use("/wfh", employeeWfhRouter);
router.use("/holidays", employeeHolidayRouter);
router.use("/payroll", employeePayrollRouter);
router.use("/documents", selfDocumentRouter);

module.exports = router;
