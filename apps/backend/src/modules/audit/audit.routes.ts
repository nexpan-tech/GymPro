import { Router } from "express";
import { AuditController } from "./audit.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Audit logs are sensitive: only platform owners and gym admins may read them.
router.get(
  "/",
  authMiddleware,
  requireRoles(Role.SUPER_ADMIN, Role.ADMIN),
  AuditController.getLogs
);

export default router;
