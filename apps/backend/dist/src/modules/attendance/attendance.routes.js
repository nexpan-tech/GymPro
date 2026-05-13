"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendance_controller_1 = require("./attendance.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const gym_middleware_1 = require("../../middleware/gym.middleware");
const role_middleware_1 = require("../../middleware/role.middleware");
const router = (0, express_1.Router)();
/**
 * All attendance routes require auth + gym context
 */
router.use(auth_middleware_1.authMiddleware);
router.use(gym_middleware_1.gymMiddleware);
/**
 * QR Check-in
 */
router.post("/checkin", (0, role_middleware_1.roleMiddleware)(["ADMIN", "RECEPTIONIST"]), attendance_controller_1.AttendanceController.checkIn);
/**
 * Member history
 */
router.get("/member/:memberId", (0, role_middleware_1.roleMiddleware)(["ADMIN", "TRAINER", "RECEPTIONIST"]), attendance_controller_1.AttendanceController.getMemberAttendance);
/**
 * Daily attendance view
 */
router.get("/daily", (0, role_middleware_1.roleMiddleware)(["ADMIN", "RECEPTIONIST"]), attendance_controller_1.AttendanceController.getDailyAttendance);
exports.default = router;
