import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { BillingController } from "./billing.controller";

const router = Router();

router.get("/plans", BillingController.getPlans);
router.post("/plans", authMiddleware, BillingController.createPlan);

router.use(authMiddleware);

router.post("/subscribe", BillingController.subscribeGym);
router.get("/subscription", BillingController.getMySubscription);
router.get("/invoices", BillingController.getInvoices);

router.patch("/invoices/:id/paid", BillingController.markInvoicePaid);
router.patch("/invoices/:id/failed", BillingController.markInvoiceFailed);

router.get("/recovery/failed-payments", BillingController.failedPaymentRecovery);

export default router;