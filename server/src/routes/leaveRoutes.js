// routes/leaveRoutes.js
// Leave routes for both admin and employee.

const express = require("express");
const {
  getMyLeave,
  getAdminLeaveRequests,
} = require("../controllers/queries/leaveQueries");
const {
  createLeave,
  approveLeave,
  rejectLeave,
} = require("../controllers/commands/leaveCommands");

const employeeLeaveRouter = express.Router();
employeeLeaveRouter.post("/", createLeave);
employeeLeaveRouter.get("/", getMyLeave);

const adminLeaveRouter = express.Router();
adminLeaveRouter.get("/", getAdminLeaveRequests);
adminLeaveRouter.patch("/:id/approve", approveLeave);
adminLeaveRouter.patch("/:id/reject", rejectLeave);

module.exports = {
  employeeLeaveRouter,
  adminLeaveRouter,
};
