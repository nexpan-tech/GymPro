import { Router } from "express";
import * as controller from "./comms.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { ROLES } from "../../constants/roles";
import { broadcastLimiter } from "../../middleware/rateLimits";

const router = Router();

router.use(authMiddleware);

const STAFF = [ROLES.ADMIN, ROLES.RECEPTIONIST];

// Channel availability — any authenticated gym user (UI gating).
router.get("/channels", roleMiddleware([...STAFF, ROLES.TRAINER]), controller.channels);

// Broadcast center + analytics (management).
router.post("/broadcast", broadcastLimiter, roleMiddleware(STAFF), controller.broadcast);
router.get("/analytics", roleMiddleware(STAFF), controller.analytics);
router.get("/delivery-logs", roleMiddleware(STAFF), controller.deliveryLogs);

// Queue health + dead-letter queue (admin/super-admin ops).
router.get("/queues/health", roleMiddleware([ROLES.ADMIN, ROLES.SUPER_ADMIN]), controller.queueHealth);
router.get("/queues/dlq", roleMiddleware([ROLES.ADMIN, ROLES.SUPER_ADMIN]), controller.dlqList);
router.post("/queues/dlq/:id/retry", roleMiddleware([ROLES.ADMIN, ROLES.SUPER_ADMIN]), controller.dlqRetry);

export default router;
