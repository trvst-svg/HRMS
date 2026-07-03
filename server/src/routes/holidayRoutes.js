// routes/holidayRoutes.js
// Separate holiday routes for admin and employee.

const express = require("express");
const { getHolidays } = require("../controllers/queries/holidayQueries");
const {
  createHoliday,
  deleteHoliday,
} = require("../controllers/commands/holidayCommands");

const adminHolidayRouter = express.Router();
adminHolidayRouter.get("/", getHolidays);
adminHolidayRouter.post("/", createHoliday);
adminHolidayRouter.delete("/:id", deleteHoliday);

// Manager can only view holidays.
const managerHolidayRouter = express.Router();
managerHolidayRouter.get("/", getHolidays);

const employeeHolidayRouter = express.Router();
employeeHolidayRouter.get("/", getHolidays);

module.exports = {
  adminHolidayRouter,
  managerHolidayRouter,
  employeeHolidayRouter,
};
