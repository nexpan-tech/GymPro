import { Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import { AttendanceService } from "./attendance.service";
import { createAuditLog } from "../../utils/audit";
import { successResponse } from "../../utils/response";
import { scanSchema, manualCheckInSchema, checkoutSchema } from "./attendance.validation";

function getRequestMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  };
}

export class AttendanceController {
  static async memberQrCheckIn(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { gymId } = scanSchema.parse(req.body);
    const { attendance, alreadyCheckedIn } = await AttendanceService.checkIn(req.user, gymId);

    if (!alreadyCheckedIn) {
      await createAuditLog({
        gymId,
        userId: req.user.id,
        action: AuditAction.CHECK_IN,
        entity: "Attendance",
        entityId: attendance.id,
        newData: attendance,
        ...getRequestMeta(req),
      });
    }

    return successResponse(
      res,
      alreadyCheckedIn ? "You are already checked in today" : "Check-in successful",
      attendance,
      alreadyCheckedIn ? 200 : 201
    );
  }

  static async manualCheckIn(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { memberId } = manualCheckInSchema.parse(req.body);
    const { attendance, alreadyCheckedIn } = await AttendanceService.manualCheckIn(req.user, memberId);

    if (!alreadyCheckedIn) {
      await createAuditLog({
        gymId: req.user.gymId ?? undefined,
        userId: req.user.id,
        action: AuditAction.CHECK_IN,
        entity: "Attendance",
        entityId: attendance.id,
        newData: attendance,
        ...getRequestMeta(req),
      });
    }

    return successResponse(
      res,
      alreadyCheckedIn ? "Member is already checked in today" : "Manual check-in successful",
      attendance,
      alreadyCheckedIn ? 200 : 201
    );
  }

  static async checkOut(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { gymId } = checkoutSchema.parse(req.body ?? {});
    const { attendance } = await AttendanceService.checkOut(req.user, gymId);

    await createAuditLog({
      gymId: attendance.gymId,
      userId: req.user.id,
      action: AuditAction.UPDATE,
      entity: "Attendance",
      entityId: attendance.id,
      newData: attendance,
      ...getRequestMeta(req),
    });

    return successResponse(res, "Check-out successful", attendance, 200);
  }

  static async checkOutMember(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const memberId = req.params.memberId as string;
    const { attendance } = await AttendanceService.checkOutMember(req.user, memberId);

    await createAuditLog({
      gymId: attendance.gymId,
      userId: req.user.id,
      action: AuditAction.UPDATE,
      entity: "Attendance",
      entityId: attendance.id,
      newData: attendance,
      ...getRequestMeta(req),
    });

    return successResponse(res, "Member checked out", attendance, 200);
  }

  static async getMyAttendance(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const data = await AttendanceService.getMyAttendance(req.user);
    return successResponse(res, "My attendance fetched", data, 200);
  }

  static async getMemberAttendance(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const data = await AttendanceService.getMemberAttendance(req.user, req.params.memberId as string);
    return successResponse(res, "Member attendance fetched", data, 200);
  }

  static async getDailyAttendance(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const data = await AttendanceService.getDailyAttendance(req.user, req.query.date as string | undefined);
    return successResponse(res, "Daily attendance fetched", data, 200);
  }

  static async getToday(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const data = await AttendanceService.getDailyAttendance(req.user, undefined);
    return successResponse(res, "Today's attendance fetched", data, 200);
  }

  static async getLive(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const data = await AttendanceService.getLive(req.user);
    return successResponse(res, "Live occupancy fetched", data, 200);
  }

  static async getAnalytics(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const days = req.query.days ? Number(req.query.days) : 7;
    const data = await AttendanceService.getAnalytics(req.user, Number.isFinite(days) ? days : 7);
    return successResponse(res, "Attendance analytics fetched", data, 200);
  }

  static async getQr(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const data = await AttendanceService.getGymQr(req.user);
    return successResponse(res, "Gym QR fetched", data, 200);
  }
}
