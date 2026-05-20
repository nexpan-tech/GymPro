import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { gymMiddleware } from "../../middleware/gym.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);
router.use(gymMiddleware);

/**
 * MEMBER scans QR pasted in gym.
 * Body:
 * {
 *   "gymId": "scanned-gym-id"
 * }
 */
router.post(
  "/scan",
  roleMiddleware(["MEMBER"]),
  asyncHandler(AttendanceController.memberQrCheckIn)
);

/**
 * MEMBER views own attendance.
 */
router.get(
  "/my",
  roleMiddleware(["MEMBER"]),
  asyncHandler(AttendanceController.getMyAttendance)
);

/**
 * ADMIN / RECEPTIONIST view any member in own gym.
 * TRAINER views assigned members only.
 */
router.get(
  "/member/:memberId",
  roleMiddleware(["ADMIN", "RECEPTIONIST", "TRAINER", "MEMBER"]),
  asyncHandler(AttendanceController.getMemberAttendance)
);

/**
 * ADMIN / RECEPTIONIST daily attendance.
 */
router.get(
  "/daily",
  roleMiddleware(["ADMIN", "RECEPTIONIST"]),
  asyncHandler(AttendanceController.getDailyAttendance)
);

export default router;