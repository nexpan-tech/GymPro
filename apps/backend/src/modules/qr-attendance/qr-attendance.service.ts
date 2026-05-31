import crypto from "crypto";
import { prisma } from "../../config/db";
import { startOfDay } from "../../utils/date";

const SECRET =
  process.env.QR_SECRET || process.env.JWT_SECRET || "qr-secret";

interface QrPayload {
  gymId: string;
  branchId?: string;
  expiresAtMs: number;
  nonce: string;
}

interface VerifiedQr {
  gymId: string;
  branchId?: string;
}

interface ScanResult {
  success: boolean;
  message: string;
  attendanceId?: string;
}

/**
 * Build a signed QR string.
 *
 * Format:  base64url(JSON(payload)) + "." + HMAC-SHA256-hex
 *
 * The caller is responsible for supplying expiresAtMs
 * (e.g. getCurrentTimestampMs() + 120_000).
 */
export function generateQrPayload(
  gymId: string,
  branchId: string | undefined,
  expiresAtMs: number
): string {
  const nonce = crypto.randomBytes(16).toString("hex");

  const payload: QrPayload = { gymId, branchId, expiresAtMs, nonce };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(payloadB64)
    .digest("hex");

  return `${payloadB64}.${sig}`;
}

/**
 * Verify a QR string and return the embedded gym/branch IDs.
 *
 * Returns null when the signature is invalid or the token has expired.
 */
export function verifyQrPayload(
  qrString: string,
  nowMs: number
): VerifiedQr | null {
  const dotIndex = qrString.lastIndexOf(".");
  if (dotIndex === -1) return null;

  const payloadB64 = qrString.slice(0, dotIndex);
  const sig = qrString.slice(dotIndex + 1);

  const expectedSig = crypto
    .createHmac("sha256", SECRET)
    .update(payloadB64)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (
    sig.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))
  ) {
    return null;
  }

  let payload: QrPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (payload.expiresAtMs < nowMs) {
    return null; // expired
  }

  return { gymId: payload.gymId, branchId: payload.branchId };
}

/**
 * Verify the QR token and create an attendance record for the member.
 *
 * Enforces:
 *  - valid, unexpired signature
 *  - tenant isolation (member's gymId must match the QR's gymId)
 *  - one check-in per member per calendar day
 */
export async function scanAttendance(
  memberId: string,
  memberGymId: string,
  qrString: string,
  nowMs: number
): Promise<ScanResult> {
  const verified = verifyQrPayload(qrString, nowMs);

  if (!verified) {
    return { success: false, message: "Invalid or expired QR code" };
  }

  // Tenant isolation: the QR must belong to the member's own gym
  if (memberGymId !== verified.gymId) {
    return { success: false, message: "QR code does not belong to your gym" };
  }

  // Derive today's midnight boundary from nowMs so we never rely on the
  // system clock for the duplicate-check (keeps the function pure / testable)
  const todayDate = startOfDay(new Date(nowMs));

  const existing = await prisma.attendance.findFirst({
    where: {
      memberId,
      gymId: memberGymId,
      date: todayDate,
    },
  });

  if (existing) {
    return { success: false, message: "Already checked in today" };
  }

  const record = await prisma.attendance.create({
    data: {
      memberId,
      gymId: memberGymId,
      date: todayDate,
    },
  });

  return {
    success: true,
    message: "Attendance recorded",
    attendanceId: record.id,
  };
}
