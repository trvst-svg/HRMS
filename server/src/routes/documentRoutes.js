// routes/documentRoutes.js
// Document request routes for employee/manager/admin.

import express from "express";
import {
  getMyDocumentRequests,
  getMyApprovedDocumentHtml,
  downloadMyApprovedDocumentPdf,
  getAdminDocumentRequests,
  getApprovedDocumentHtml,
  downloadApprovedDocumentPdf,
} from "../controllers/queries/documentQueries.js";
import {
  createMyDocumentRequest,
  approveDocumentRequest,
  rejectDocumentRequest,
} from "../controllers/commands/documentCommands.js";

const selfDocumentRouter = express.Router();
selfDocumentRouter.post("/", createMyDocumentRequest);
selfDocumentRouter.get("/", getMyDocumentRequests);
selfDocumentRouter.get("/:id/view", getMyApprovedDocumentHtml);
selfDocumentRouter.get("/:id/download", downloadMyApprovedDocumentPdf);

const adminDocumentRouter = express.Router();
adminDocumentRouter.get("/", getAdminDocumentRequests);
adminDocumentRouter.patch("/:id/approve", approveDocumentRequest);
adminDocumentRouter.patch("/:id/reject", rejectDocumentRequest);
adminDocumentRouter.get("/:id/view", getApprovedDocumentHtml);
adminDocumentRouter.get("/:id/download", downloadApprovedDocumentPdf);

export { selfDocumentRouter, adminDocumentRouter };
export default { selfDocumentRouter, adminDocumentRouter };
