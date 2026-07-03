// routes/announcementRoutes.js
// Admin announcement routes.

const express = require("express");
const {
  getAnnouncements,
} = require("../controllers/queries/announcementQueries");
const {
  createAnnouncement,
  deleteAnnouncement,
} = require("../controllers/commands/announcementCommands");

const router = express.Router();
const managerAnnouncementRouter = express.Router();

router.get("/", getAnnouncements);
router.post("/", createAnnouncement);
router.delete("/:id", deleteAnnouncement);

// Manager can only view announcements.
managerAnnouncementRouter.get("/", getAnnouncements);

module.exports = router;
module.exports.managerAnnouncementRouter = managerAnnouncementRouter;
