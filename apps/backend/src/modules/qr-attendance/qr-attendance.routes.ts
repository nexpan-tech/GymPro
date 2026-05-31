import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { generateHandler, scanHandler } from "./qr-attendance.controller";

const router = Router();

// All routes require a valid JWT
router.use(authMiddleware);

/**
 * POST /qr-attendance/generate
 *
 * Generates a signed QR payload (valid 120 s).
 * Role enforcement is done inside the controller so the 403 body is
 * consistent with all other responses in this module.
 * Allowed: ADMIN | TRAINER | RECEPTIONIST
 */
router.post("/generate", asyncHandler(generateHandler));

/**
 * POST /qr-attendance/scan
 *
 * Member scans QR code to record attendance.
 * Allowed: MEMBER
 *
 * Body: { "qrPayload": "<signed-qr-string>" }
 */
router.post("/scan", asyncHandler(scanHandler));

export default router;
