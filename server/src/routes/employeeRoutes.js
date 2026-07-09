// routes/employeeRoutes.js
// Admin side employee management routes.

import express from "express";
import {
  getEmployees,
  getEmployeeProfile,
} from "../controllers/queries/adminQueries.js";
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/commands/adminCommands.js";

import { uploadAvatar } from "../middleware/upload.js";

const router = express.Router();

router.post("/", uploadAvatar, createEmployee);
router.get("/", getEmployees);
router.get("/:id/profile", getEmployeeProfile);
router.patch("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;
