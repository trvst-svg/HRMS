import express from "express";
import { protect, requireRole } from "../middleware/auth.js";
import commands from "../controllers/commands/saasCommands.js";
import queries from "../controllers/queries/saasQueries.js";

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

export default router;
