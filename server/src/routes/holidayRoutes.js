// routes/holidayRoutes.js
// Separate holiday routes for admin and employee.

import express from "express";
import { getHolidays } from "../controllers/queries/holidayQueries.js";
import {
  createHoliday,
  deleteHoliday,
} from "../controllers/commands/holidayCommands.js";

const adminHolidayRouter = express.Router();
adminHolidayRouter.get("/", getHolidays);
adminHolidayRouter.post("/", createHoliday);
adminHolidayRouter.delete("/:id", deleteHoliday);

// Manager can only view holidays.
const managerHolidayRouter = express.Router();
managerHolidayRouter.get("/", getHolidays);

const employeeHolidayRouter = express.Router();
employeeHolidayRouter.get("/", getHolidays);

export { adminHolidayRouter, managerHolidayRouter, employeeHolidayRouter };
export default { adminHolidayRouter, managerHolidayRouter, employeeHolidayRouter };
