// routes/payrollRoutes.js
// Payroll routers for admin and employee.

import express from "express";
import {
  getAdminPayrolls,
  getMyPayrolls,
  getTaxConfig,
  getAdminPayrollHtml,
  getMyPayrollHtml,
  downloadAdminPayrollPdf,
  downloadMyPayrollPdf,
} from "../controllers/queries/payrollQueries.js";
import {
  createPayroll,
  calculatePayroll,
} from "../controllers/commands/payrollCommands.js";

const adminPayrollRouter = express.Router();
adminPayrollRouter.get("/", getAdminPayrolls);
adminPayrollRouter.post("/", createPayroll);
adminPayrollRouter.get("/tax-config", getTaxConfig);
adminPayrollRouter.post("/calculate", calculatePayroll);
adminPayrollRouter.get("/:id/html", getAdminPayrollHtml);
adminPayrollRouter.get("/:id/download", downloadAdminPayrollPdf);

const employeePayrollRouter = express.Router();
employeePayrollRouter.get("/", getMyPayrolls);
employeePayrollRouter.get("/:id/html", getMyPayrollHtml);
employeePayrollRouter.get("/:id/download", downloadMyPayrollPdf);

export { adminPayrollRouter, employeePayrollRouter };
export default { adminPayrollRouter, employeePayrollRouter };
