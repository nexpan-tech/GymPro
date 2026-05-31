import { Request, Response } from "express";
import { generateQrPayload, scanAttendance } from "./qr-attendance.service";
import { getCurrentTimestampMs } from "../../utils/time";
import { successResponse, errorResponse } from "../../utils/response";
import { requireGym } from "../../utils/tenant";

/**
 * POST /qr-attendance/generate
 *
 * Allowed roles: ADMIN, TRAINER, RECEPTIONIST
 *
 * Generates a signed QR payload valid for 120 seconds.
 * gymId and branchId are sourced exclusively from req.user (JWT claims)
 * — never from the request body — to prevent cross-gym forgery.
 */
export async function generateHandler(
  req: Request,
  res: Response
): Promise<Response> {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { role } = req.user;

  if (role !== "ADMIN" && role !== "TRAINER" && role !== "RECEPTIONIST") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const gymId = requireGym(req.user); // throws AppError if missing
  const branchId: string | undefined = (req.user as any).branchId ?? undefined;

  const nowMs = getCurrentTimestampMs();
  const expiresAtMs = nowMs + 120_000; // 2 minutes

  const qrPayload = generateQrPayload(gymId, branchId, expiresAtMs);

  return successResponse(
    res,
    "QR code generated",
    { qrPayload, expiresIn: 120 },
    200
  );
}

/**
 * POST /qr-attendance/scan
 *
 * Allowed roles: MEMBER
 *
 * Body: { qrPayload: string }
 *
 * Verifies the signed QR string and records attendance for the authenticated
 * member.  gymId is taken from the JWT — the member cannot inject a different
 * gym via the request body.
 */
export async function scanHandler(
  req: Request,
  res: Response
): Promise<Response> {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (req.user.role !== "MEMBER") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { qrPayload } = req.body as { qrPayload?: string };

  if (!qrPayload || typeof qrPayload !== "string") {
    return errorResponse(res, "qrPayload is required", 400);
  }

  const memberId = req.user.id;
  const memberGymId = requireGym(req.user);
  const nowMs = getCurrentTimestampMs();

  const result = await scanAttendance(memberId, memberGymId, qrPayload, nowMs);

  if (!result.success) {
    return errorResponse(res, result.message, 400);
  }

  return successResponse(res, result.message, { attendanceId: result.attendanceId }, 201);
}
