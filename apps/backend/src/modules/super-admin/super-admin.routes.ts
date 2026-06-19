import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { asyncHandler } from "../../utils/asyncHandler";
import { SuperAdminController } from "./super-admin.controller";

const router = Router();

// Entire surface is SUPER_ADMIN only, no tenant scope (whole platform).
router.use(authMiddleware, roleMiddleware([ROLES.SUPER_ADMIN]));

// Dashboard + gyms (real platform data)
router.get("/dashboard", asyncHandler(SuperAdminController.dashboard));
router.get("/gyms", asyncHandler(SuperAdminController.gyms));

// SaaS billing
router.get("/subscriptions", asyncHandler(SuperAdminController.subscriptions));
router.get("/billing/summary", asyncHandler(SuperAdminController.revenueSummary));
router.post("/billing/generate", asyncHandler(SuperAdminController.generateInvoices));
router.get("/billing/invoices", asyncHandler(SuperAdminController.listInvoices));
router.get("/billing/invoices/:id", asyncHandler(SuperAdminController.getInvoice));
router.get("/billing/invoices/:id/pdf", asyncHandler(SuperAdminController.invoicePdf));
router.post("/billing/invoices/:id/pay", asyncHandler(SuperAdminController.recordPayment));
router.post("/billing/invoices/:id/cancel", asyncHandler(SuperAdminController.cancelInvoice));

// Platform billing identity (Nexpan Tech) — GST, bank, invoice settings.
router.get("/settings", asyncHandler(SuperAdminController.getSettings));
router.put("/settings", asyncHandler(SuperAdminController.updateSettings));

// Operations
router.get("/metrics", asyncHandler(SuperAdminController.metrics));
router.get("/monitoring", asyncHandler(SuperAdminController.monitoring));
router.get("/queue", asyncHandler(SuperAdminController.queue));

export default router;
