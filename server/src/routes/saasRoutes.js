const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const commands = require("../controllers/commands/saasCommands");
const queries = require("../controllers/queries/saasQueries");

const router = express.Router();

router.post("/check-in-gps", protect, commands.checkInGps);

router.get("/contracts", protect, queries.getContracts);
router.post(
  "/contracts",
  protect,
  requireRole("admin"),
  commands.issueContract,
);
router.post("/contracts/:id/sign", protect, commands.signContract);

router.get("/okrs", protect, queries.getOkrs);
router.post(
  "/okrs",
  protect,
  requireRole("admin", "manager"),
  commands.createOkr,
);
router.put("/okrs/:id/progress", protect, commands.updateOkrProgress);

router.get("/jobs", protect, queries.getJobPostings);
router.post("/jobs", protect, requireRole("admin"), commands.createJobPosting);
router.post("/jobs/:id/apply", protect, commands.applyJob);

router.get(
  "/applications",
  protect,
  requireRole("admin", "manager"),
  queries.getJobApplications,
);
router.put(
  "/applications/:id/status",
  protect,
  requireRole("admin", "manager"),
  commands.updateApplicationStatus,
);

router.get("/shifts", protect, queries.getShifts);
router.post(
  "/shifts",
  protect,
  requireRole("admin", "manager"),
  commands.assignShift,
);

module.exports = router;
