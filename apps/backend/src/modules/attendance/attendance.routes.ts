import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { gymMiddleware } from "../../middleware/gym.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";

const router = Router();

/**
 * All attendance routes require auth + gym context
 */
router.use(authMiddleware);
router.use(gymMiddleware);

/**
 * QR Check-in
 */
router.post(
  "/checkin",
  roleMiddleware(["ADMIN", "RECEPTIONIST"]),
  AttendanceController.checkIn
);

/**
 * Member history
 */
router.get(
  "/member/:memberId",
  roleMiddleware(["ADMIN", "TRAINER", "RECEPTIONIST"]),
  AttendanceController.getMemberAttendance
);

/**
 * Daily attendance view
 */
router.get(
  "/daily",
  roleMiddleware(["ADMIN", "RECEPTIONIST"]),
  AttendanceController.getDailyAttendance
);

export default router;