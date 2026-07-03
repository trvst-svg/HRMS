// routes/payrollRoutes.js
// Payroll routers for admin and employee.

const express = require("express");
const {
  getAdminPayrolls,
  getMyPayrolls,
  getTaxConfig,
  getAdminPayrollHtml,
  getMyPayrollHtml,
  downloadAdminPayrollPdf,
  downloadMyPayrollPdf,
} = require("../controllers/queries/payrollQueries");
const {
  createPayroll,
  calculatePayroll,
} = require("../controllers/commands/payrollCommands");

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

module.exports = {
  adminPayrollRouter,
  employeePayrollRouter,
};
