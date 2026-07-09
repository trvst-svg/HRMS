import express from "express";
const router = express.Router();
import {
  protect,
  requireRole,
  requireHRorAdmin,
  requireManagerOrHRorAdmin,
} from "../middleware/auth.js";

import expenseCtrl from "../controllers/expenseController.js";
import assetCtrl from "../controllers/assetController.js";
import reviewCtrl from "../controllers/reviewController.js";
import meetingCtrl from "../controllers/meetingController.js";

// Expense claims
router.post("/expenses", protect, expenseCtrl.createExpenseClaim);
router.get("/expenses/my", protect, expenseCtrl.getMyExpenseClaims);
router.get(
  "/expenses",
  protect,
  requireHRorAdmin,
  expenseCtrl.getAllExpenseClaims,
);
router.patch(
  "/expenses/:id/review",
  protect,
  requireHRorAdmin,
  expenseCtrl.reviewExpenseClaim,
);

// Asset Management
router.post("/assets", protect, requireHRorAdmin, assetCtrl.createAsset);
router.get("/assets", protect, requireHRorAdmin, assetCtrl.getAllAssets);
router.get("/assets/my", protect, assetCtrl.getMyAssets);
router.patch(
  "/assets/:id",
  protect,
  requireHRorAdmin,
  assetCtrl.updateAssetAssignment,
);

// Performance Reviews
router.post(
  "/reviews",
  protect,
  requireHRorAdmin,
  reviewCtrl.createReviewCycle,
);
router.get("/reviews", protect, requireHRorAdmin, reviewCtrl.getAllReviews);
router.get("/reviews/my", protect, reviewCtrl.getMyReviews);
router.patch("/reviews/:id/self", protect, reviewCtrl.submitSelfAppraisal);
router.patch(
  "/reviews/:id/manager",
  protect,
  requireRole("admin", "manager", "department_head"),
  reviewCtrl.submitManagerAppraisal,
);

// HR Meetings & Interviews Scheduler
router.post("/meetings", protect, requireManagerOrHRorAdmin, meetingCtrl.createMeeting);
router.get("/meetings", protect, meetingCtrl.getMeetings);
router.patch(
  "/meetings/:id",
  protect,
  requireManagerOrHRorAdmin,
  meetingCtrl.updateMeeting,
);
router.get(
  "/hr-employees",
  protect,
  requireManagerOrHRorAdmin,
  meetingCtrl.getHrEmployees,
);

export default router;
