import { Router } from "express";
import * as controller from "./payment.controller";
import { razorpayWebhook } from "./payment.webhook";

import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

/**
 * PUBLIC WEBHOOK
 * Razorpay calls this endpoint
 */
router.post("/webhook/razorpay", razorpayWebhook);

/**
 * PROTECTED ROUTES
 */
router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  controller.createPayment
);

router.get(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  controller.getPayments
);

router.get(
  "/:id",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  controller.getPaymentById
);

export default router;