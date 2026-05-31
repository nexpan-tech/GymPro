import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { DeviceSessionController } from "./device-session.controller";

const router = Router();

router.use(authMiddleware);

// POST /api/device-sessions/register
router.post("/register", DeviceSessionController.register);

// PATCH /api/device-sessions/:deviceId/push-token
router.patch("/:deviceId/push-token", DeviceSessionController.updatePushToken);

// PATCH /api/device-sessions/:deviceId/seen
router.patch("/:deviceId/seen", DeviceSessionController.markSeen);

// DELETE /api/device-sessions/:deviceId
router.delete("/:deviceId", DeviceSessionController.remove);

// GET /api/device-sessions/me
router.get("/me", DeviceSessionController.getMySessions);

export default router;
