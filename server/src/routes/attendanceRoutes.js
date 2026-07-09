// routes/attendanceRoutes.js
// We keep admin and employee attendance in one place.

import express from "express";
import {
  getAdminAttendance,
  getMyAttendance,
} from "../controllers/queries/attendanceQueries.js";
import {
  checkIn,
  checkOut,
} from "../controllers/commands/attendanceCommands.js";

const adminAttendanceRouter = express.Router();
adminAttendanceRouter.get("/", getAdminAttendance);

const employeeAttendanceRouter = express.Router();
employeeAttendanceRouter.post("/check-in", checkIn);
employeeAttendanceRouter.post("/check-out", checkOut);
employeeAttendanceRouter.get("/", getMyAttendance);

export { adminAttendanceRouter, employeeAttendanceRouter };
export default { adminAttendanceRouter, employeeAttendanceRouter };
