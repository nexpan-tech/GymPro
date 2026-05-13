"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const attendance_service_1 = require("./attendance.service");
const response_1 = require("../../utils/response");
class AttendanceController {
    /**
     * QR Check-in
     */
    static async checkIn(req, res) {
        const gymId = req.user.gymId;
        const { memberId, date } = req.body;
        const data = await attendance_service_1.AttendanceService.checkIn(gymId, memberId, date);
        return (0, response_1.successResponse)(res, "Check-in successful", data);
    }
    /**
     * Member attendance history
     */
    static async getMemberAttendance(req, res) {
        const gymId = req.user.gymId;
        const memberId = req.params.memberId;
        const data = await attendance_service_1.AttendanceService.getMemberAttendance(gymId, memberId);
        return (0, response_1.successResponse)(res, "Attendance fetched", data);
    }
    /**
     * Daily attendance (gym dashboard)
     */
    static async getDailyAttendance(req, res) {
        const gymId = req.user.gymId;
        const { date } = req.query;
        const data = await attendance_service_1.AttendanceService.getDailyAttendance(gymId, date);
        return (0, response_1.successResponse)(res, "Daily attendance fetched", data);
    }
}
exports.AttendanceController = AttendanceController;
