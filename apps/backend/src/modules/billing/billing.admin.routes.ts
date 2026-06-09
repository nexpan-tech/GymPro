import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { asyncHandler } from "../../utils/asyncHandler";
import { BillingAdminController } from "./billing.admin.controller";

const router = Router();

// Platform SaaS revenue analytics — SUPER_ADMIN only (no tenant scope).
router.use(authMiddleware, roleMiddleware([ROLES.SUPER_ADMIN]));

router.get("/overview", asyncHandler(BillingAdminController.overview));
router.get("/mrr", asyncHandler(BillingAdminController.mrr));
router.get("/arr", asyncHandler(BillingAdminController.arr));
router.get("/churn", asyncHandler(BillingAdminController.churn));
router.get("/revenue-trend", asyncHandler(BillingAdminController.revenueTrend));

export default router;
