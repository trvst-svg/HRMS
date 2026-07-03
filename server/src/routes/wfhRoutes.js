// routes/wfhRoutes.js
// Work from home routes for both admin and employee.

const express = require("express");
const {
  getMyWfh,
  getAdminWfhRequests,
} = require("../controllers/queries/leaveQueries");
const {
  createWfh,
  approveWfh,
  rejectWfh,
} = require("../controllers/commands/leaveCommands");

const employeeWfhRouter = express.Router();
employeeWfhRouter.post("/", createWfh);
employeeWfhRouter.get("/", getMyWfh);

const adminWfhRouter = express.Router();
adminWfhRouter.get("/", getAdminWfhRequests);
adminWfhRouter.patch("/:id/approve", approveWfh);
adminWfhRouter.patch("/:id/reject", rejectWfh);

module.exports = {
  employeeWfhRouter,
  adminWfhRouter,
};
