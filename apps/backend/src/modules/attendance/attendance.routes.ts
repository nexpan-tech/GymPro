import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { gymMiddleware } from "../../middleware/gym.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(authMiddleware);
router.use(gymMiddleware);

// ─── Member self-service (QR scan model: body { gymId }) ─────────────────────
router.post("/scan", roleMiddleware(["MEMBER"]), asyncHandler(AttendanceController.memberQrCheckIn));
router.post("/checkout", roleMiddleware(["MEMBER"]), asyncHandler(AttendanceController.checkOut));
router.get("/my", roleMiddleware(["MEMBER"]), asyncHandler(AttendanceController.getMyAttendance));

// ─── Admin / Receptionist dashboards ─────────────────────────────────────────
router.get("/qr", roleMiddleware(["ADMIN", "RECEPTIONIST"]), asyncHandler(AttendanceController.getQr));
router.get("/today", roleMiddleware(["ADMIN", "RECEPTIONIST"]), asyncHandler(AttendanceController.getToday));
router.get("/daily", roleMiddleware(["ADMIN", "RECEPTIONIST"]), asyncHandler(AttendanceController.getDailyAttendance));
router.get("/live", roleMiddleware(["ADMIN", "RECEPTIONIST"]), asyncHandler(AttendanceController.getLive));
router.get("/analytics", roleMiddleware(["ADMIN", "RECEPTIONIST"]), asyncHandler(AttendanceController.getAnalytics));

router.post("/manual", roleMiddleware(["ADMIN", "RECEPTIONIST"]), asyncHandler(AttendanceController.manualCheckIn));
router.post(
  "/member/:memberId/checkout",
  roleMiddleware(["ADMIN", "RECEPTIONIST"]),
  asyncHandler(AttendanceController.checkOutMember)
);

// ─── Shared (parameterised — declared last) ──────────────────────────────────
router.get(
  "/member/:memberId",
  roleMiddleware(["ADMIN", "RECEPTIONIST", "TRAINER", "MEMBER"]),
  asyncHandler(AttendanceController.getMemberAttendance)
);

export default router;
