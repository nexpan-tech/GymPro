import { Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import { AttendanceService } from "./attendance.service";
import { createAuditLog } from "../../utils/audit";
import { successResponse } from "../../utils/response";

function getRequestMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  };
}

export class AttendanceController {
  static async memberQrCheckIn(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { gymId } = req.body;

    if (!gymId) {
      return res.status(400).json({
        success: false,
        message: "Scanned gym ID is required",
      });
    }

    const data = await AttendanceService.memberQrCheckIn(
      req.user,
      gymId
    );

    await createAuditLog({
      gymId,
      userId: req.user.id,
      action: AuditAction.CHECK_IN,
      entity: "Attendance",
      entityId: data.id,
      newData: data,
      ...getRequestMeta(req),
    });

    return successResponse(
      res,
      "Check-in successful",
      data,
      201
    );
  }

  static async getMyAttendance(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await AttendanceService.getMyAttendance(
      req.user
    );

    return successResponse(
      res,
      "My attendance fetched",
      data,
      200
    );
  }

  static async getMemberAttendance(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const memberId = req.params.memberId as string;

    const data = await AttendanceService.getMemberAttendance(
      req.user,
      memberId
    );

    return successResponse(
      res,
      "Member attendance fetched",
      data,
      200
    );
  }

  static async getDailyAttendance(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { date } = req.query;

    const data = await AttendanceService.getDailyAttendance(
      req.user,
      date as string | undefined
    );

    return successResponse(
      res,
      "Daily attendance fetched",
      data,
      200
    );
  }
}