// routes/departmentRoutes.js
import express from "express";
import { getDepartments } from "../controllers/queries/departmentQueries.js";
import {
  createDepartment,
  deleteDepartment,
} from "../controllers/commands/departmentCommands.js";

const router = express.Router();

router.get("/", getDepartments);
router.post("/", createDepartment);
router.delete("/:id", deleteDepartment);

export default router;
