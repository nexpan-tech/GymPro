import { Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import { AuthService } from "./auth.service";
import { createAuditLog } from "../../utils/audit";
import { registerSchema, loginSchema } from "./auth.validation";

function getRequestMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  };
}

export class AuthController {
  static async register(req: Request, res: Response) {
    const data = registerSchema.parse(req.body);
    const result = await AuthService.register(data);

    await createAuditLog({
      gymId: result.user.gymId,
      userId: result.user.id,
      action: AuditAction.CREATE,
      entity: "AuthRegister",
      entityId: result.user.id,
      newData: result.user,
      ...getRequestMeta(req),
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  }

  static async login(req: Request, res: Response) {
    const data = loginSchema.parse(req.body);
    const result = await AuthService.login(data);

    await createAuditLog({
      gymId: result.user.gymId,
      userId: result.user.id,
      action: AuditAction.LOGIN,
      entity: "AuthLogin",
      entityId: result.user.id,
      newData: {
        email: result.user.email,
        role: result.user.role,
      },
      ...getRequestMeta(req),
    });

    return res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  }

  static async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const result = await AuthService.refresh(refreshToken);

    return res.json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  }

  static async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    await AuthService.logout(refreshToken);

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  }

  static async logoutAll(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await AuthService.logoutAll(req.user.id);

    return res.json({
      success: true,
      message: "Logged out from all devices successfully",
    });
  }

  static async me(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await AuthService.me(req.user.id);

    return res.json({
      success: true,
      data: user,
    });
  }
}