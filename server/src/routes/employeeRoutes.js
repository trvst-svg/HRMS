// routes/employeeRoutes.js
// Admin side employee management routes.

const express = require("express");
const {
  getEmployees,
  getEmployeeProfile,
} = require("../controllers/queries/adminQueries");
const {
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/commands/adminCommands");

const { uploadAvatar } = require("../middleware/upload");

const router = express.Router();

router.post("/", uploadAvatar, createEmployee);
router.get("/", getEmployees);
router.get("/:id/profile", getEmployeeProfile);
router.patch("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;
