// routes/leaveRoutes.js
// Leave routes for both admin and employee.

import express from "express";
import {
  getMyLeave,
  getAdminLeaveRequests,
} from "../controllers/queries/leaveQueries.js";
import {
  createLeave,
  approveLeave,
  rejectLeave,
} from "../controllers/commands/leaveCommands.js";

const employeeLeaveRouter = express.Router();
employeeLeaveRouter.post("/", createLeave);
employeeLeaveRouter.get("/", getMyLeave);

const adminLeaveRouter = express.Router();
adminLeaveRouter.get("/", getAdminLeaveRequests);
adminLeaveRouter.patch("/:id/approve", approveLeave);
adminLeaveRouter.patch("/:id/reject", rejectLeave);

export { employeeLeaveRouter, adminLeaveRouter };
export default { employeeLeaveRouter, adminLeaveRouter };
