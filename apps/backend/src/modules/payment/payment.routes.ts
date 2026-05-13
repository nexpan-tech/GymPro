import { Router } from "express";
import * as controller from "./payment.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";

const router = Router();

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