import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { BillingController } from "./billing.controller";

const router = Router();

// Plan catalog: anyone authenticated can browse; only SUPER_ADMIN can create
// platform plans (POST /plans was previously unguarded — security gap).
router.get("/plans", authMiddleware, BillingController.getPlans);
router.post(
  "/plans",
  authMiddleware,
  roleMiddleware([ROLES.SUPER_ADMIN]),
  BillingController.createPlan,
);

router.use(authMiddleware);

// A gym subscribing to / viewing its own SaaS subscription + invoices (gym admin).
router.post("/subscribe", roleMiddleware([ROLES.ADMIN]), BillingController.subscribeGym);
router.get(
  "/subscription",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  BillingController.getMySubscription,
);
router.get(
  "/invoices",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  BillingController.getInvoices,
);

router.patch(
  "/invoices/:id/paid",
  roleMiddleware([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  BillingController.markInvoicePaid,
);
router.patch(
  "/invoices/:id/failed",
  roleMiddleware([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  BillingController.markInvoiceFailed,
);

router.get(
  "/recovery/failed-payments",
  roleMiddleware([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  BillingController.failedPaymentRecovery,
);

export default router;
