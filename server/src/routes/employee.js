// routes/employee.js
// Main employee router. Simple + readable.

import express from "express";
const router = express.Router();

import { protect, requireRole } from "../middleware/auth.js";
import {
  getEmployeeDashboardSummary,
  getMyProfile,
} from "../controllers/queries/employeeQueries.js";
import {
  updateMyProfile,
  requestChangePasswordOtp,
  changeMyPassword,
} from "../controllers/commands/employeeCommands.js";
import { employeeAttendanceRouter } from "./attendanceRoutes.js";
import { employeeLeaveRouter } from "./leaveRoutes.js";
import { employeeWfhRouter } from "./wfhRoutes.js";
import { employeePayrollRouter } from "./payrollRoutes.js";
import { employeeHolidayRouter } from "./holidayRoutes.js";
import { selfDocumentRouter } from "./documentRoutes.js";

import { uploadAvatar } from "../middleware/upload.js";

// All employee routes need auth + employee role.
router.use(protect);
router.use(requireRole("employee"));

router.get("/ping", (req, res) => {
  res.json({ message: "Employee routes working", user: req.user.email });
});

router.get("/dashboard-summary", getEmployeeDashboardSummary);
router.get("/profile", getMyProfile);
router.put("/profile", uploadAvatar, updateMyProfile);
router.post("/change-password/request-otp", requestChangePasswordOtp);
router.patch("/change-password", changeMyPassword);

// Feature routes
router.use("/attendance", employeeAttendanceRouter);
router.use("/leave", employeeLeaveRouter);
router.use("/wfh", employeeWfhRouter);
router.use("/holidays", employeeHolidayRouter);
router.use("/payroll", employeePayrollRouter);
router.use("/documents", selfDocumentRouter);

export default router;
