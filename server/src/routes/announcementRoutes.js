// routes/announcementRoutes.js
// Admin announcement routes.

import express from "express";
import {
  getAnnouncements,
} from "../controllers/queries/announcementQueries.js";
import {
  createAnnouncement,
  deleteAnnouncement,
} from "../controllers/commands/announcementCommands.js";

const router = express.Router();
const managerAnnouncementRouter = express.Router();

router.get("/", getAnnouncements);
router.post("/", createAnnouncement);
router.delete("/:id", deleteAnnouncement);

// Manager can only view announcements.
managerAnnouncementRouter.get("/", getAnnouncements);

export default router;
export { managerAnnouncementRouter };
