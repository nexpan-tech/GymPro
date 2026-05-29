import { Router } from "express";
import { AuditController } from "./audit.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, AuditController.getLogs);

export default router;