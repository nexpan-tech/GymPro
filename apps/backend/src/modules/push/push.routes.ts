import { Router } from "express";
import { PushController } from "./push.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

/**
 * POST /push/register-token
 * Save Expo push token for the authenticated user.
 * Body: { token: string, platform: 'ios' | 'android' }
 */
router.post("/register-token", authMiddleware, PushController.registerToken);

/**
 * POST /push/test
 * Send a test push notification to all devices registered for the current user.
 */
router.post("/test", authMiddleware, PushController.sendTest);

export default router;
