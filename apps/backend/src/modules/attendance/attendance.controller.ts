import { Response } from "express";
import { AttendanceService } from "./attendance.service";
import { successResponse } from "../../utils/response";

export class AttendanceController {
  /**
   * QR Check-in
   */
  static async checkIn(req: any, res: Response) {
    const gymId = req.user.gymId;
    const { memberId, date } = req.body;

    const data = await AttendanceService.checkIn(gymId, memberId, date);

    return successResponse(res, "Check-in successful", data);
  }

  /**
   * Member attendance history
   */
  static async getMemberAttendance(req: any, res: Response) {
    const gymId = req.user.gymId;
    const memberId = req.params.memberId;

    const data = await AttendanceService.getMemberAttendance(
      gymId,
      memberId
    );

    return successResponse(res, "Attendance fetched", data);
  }

  /**
   * Daily attendance (gym dashboard)
   */
  static async getDailyAttendance(req: any, res: Response) {
    const gymId = req.user.gymId;
    const { date } = req.query;

    const data = await AttendanceService.getDailyAttendance(
      gymId,
      date as string
    );

    return successResponse(res, "Daily attendance fetched", data);
  }
}