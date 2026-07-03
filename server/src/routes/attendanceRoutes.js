// routes/attendanceRoutes.js
// We keep admin and employee attendance in one place.

const express = require("express");
const {
  getAdminAttendance,
  getMyAttendance,
} = require("../controllers/queries/attendanceQueries");
const {
  checkIn,
  checkOut,
} = require("../controllers/commands/attendanceCommands");

const adminAttendanceRouter = express.Router();
adminAttendanceRouter.get("/", getAdminAttendance);

const employeeAttendanceRouter = express.Router();
employeeAttendanceRouter.post("/check-in", checkIn);
employeeAttendanceRouter.post("/check-out", checkOut);
employeeAttendanceRouter.get("/", getMyAttendance);

module.exports = {
  adminAttendanceRouter,
  employeeAttendanceRouter,
};
