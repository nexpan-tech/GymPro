import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { asyncHandler } from "../../utils/asyncHandler";
import { InvoiceController } from "./invoice.controller";

const router = Router();

router.use(authMiddleware);

// Member self-service — before "/:id".
router.get(
  "/my",
  roleMiddleware([ROLES.MEMBER, ROLES.ADMIN, ROLES.RECEPTIONIST]),
  asyncHandler(InvoiceController.listMine),
);

// Gym-wide invoice list (staff).
router.get(
  "/",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST]),
  asyncHandler(InvoiceController.listForGym),
);

router.get(
  "/:id",
  roleMiddleware([ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.MEMBER]),
  asyncHandler(InvoiceController.getById),
);

export default router;
