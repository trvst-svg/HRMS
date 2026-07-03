// routes/departmentRoutes.js
const express = require("express");
const { getDepartments } = require("../controllers/queries/departmentQueries");
const {
  createDepartment,
  deleteDepartment,
} = require("../controllers/commands/departmentCommands");

const router = express.Router();

router.get("/", getDepartments);
router.post("/", createDepartment);
router.delete("/:id", deleteDepartment);

module.exports = router;
