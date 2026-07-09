// routes/wfhRoutes.js
// Work from home routes for both admin and employee.

import express from "express";
import {
  getMyWfh,
  getAdminWfhRequests,
} from "../controllers/queries/leaveQueries.js";
import {
  createWfh,
  approveWfh,
  rejectWfh,
} from "../controllers/commands/leaveCommands.js";

const employeeWfhRouter = express.Router();
employeeWfhRouter.post("/", createWfh);
employeeWfhRouter.get("/", getMyWfh);

const adminWfhRouter = express.Router();
adminWfhRouter.get("/", getAdminWfhRequests);
adminWfhRouter.patch("/:id/approve", approveWfh);
adminWfhRouter.patch("/:id/reject", rejectWfh);

export { employeeWfhRouter, adminWfhRouter };
export default { employeeWfhRouter, adminWfhRouter };
