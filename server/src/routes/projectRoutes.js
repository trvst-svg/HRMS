const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const commands = require("../controllers/commands/projectCommands");
const queries = require("../controllers/queries/projectQueries");

const router = express.Router();

router.get(
  "/available-managers",
  protect,
  requireRole("admin", "department_head"),
  queries.getAvailableManagers,
);
router.get("/available-employees", protect, queries.getAvailableEmployees);

router.get("/", protect, queries.getProjects);
router.post(
  "/",
  protect,
  requireRole("admin", "department_head"),
  commands.createProject,
);

router.get("/my/active-task", protect, queries.getMyActiveTask);

router.get("/:id", protect, queries.getProjectDetails);
router.put("/:id/documentation", protect, commands.updateDocumentation);
router.post("/:id/members", protect, commands.assignMembers);
router.post("/:id/tasks", protect, commands.createTask);

router.post("/tasks/:id/request-report", protect, commands.requestReport);
router.post("/tasks/:id/report", protect, commands.submitReport);
router.post("/tasks/:id/request-extension", protect, commands.requestExtension);
router.post("/tasks/:id/review-extension", protect, commands.reviewExtension);
router.post("/tasks/:id/request-transfer", protect, commands.requestTransfer);
router.post("/tasks/:id/review-transfer", protect, commands.reviewTransfer);
router.put("/tasks/:id/status", protect, commands.updateTaskStatus);

module.exports = router;
