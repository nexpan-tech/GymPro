import { Router } from "express";
import { MobileController } from "./mobile.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

/**
 * GET /health — public, no auth required
 * Returns service liveness.
 */
router.get("/health", asyncHandler(MobileController.health));

/**
 * GET /config — public, no auth required
 * Returns static mobile app feature flags and version info.
 */
router.get("/config", asyncHandler(MobileController.getConfig));

/**
 * POST /sync — requires auth
 * Body: { actions: SyncAction[] }
 * Processes offline-queued actions from the mobile client.
 * Returns: { results: SyncResult[], processedAt: string }
 */
router.post("/sync", authMiddleware, asyncHandler(MobileController.sync));

export default router;
