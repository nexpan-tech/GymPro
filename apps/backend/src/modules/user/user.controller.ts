import { Request, Response } from "express";
import { AuditAction } from "@prisma/client";
import * as userService from "./user.service";
import { createAuditLog } from "../../utils/audit";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";
import {
  createUserSchema,
  updateUserSchema,
} from "./user.validation";

function getGymId(req: Request, res: Response): string | null {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });

    return null;
  }

  if (!req.user.gymId) {
    res.status(400).json({
      success: false,
      message: "Gym ID required",
    });

    return null;
  }

  return req.user.gymId;
}

function getRequestMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  };
}

export const createUser = asyncHandler(
  async (req: Request, res: Response) => {
    const gymId = getGymId(req, res);

    if (!gymId || !req.user) return;

    const payload = createUserSchema.parse(req.body);

    const user = await userService.createUser(
      gymId,
      payload
    );

    await createAuditLog({
      gymId,
      userId: req.user.id,
      action: AuditAction.CREATE,
      entity: "User",
      entityId: user.id,
      newData: user,
      ...getRequestMeta(req),
    });

    return successResponse(
      res,
      "User created successfully",
      user,
      201
    );
  }
);

export const getUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const gymId = getGymId(req, res);

    if (!gymId) return;

    const users = await userService.getUsers(gymId);

    return successResponse(
      res,
      "Users fetched successfully",
      users,
      200
    );
  }
);

export const getUserById = asyncHandler(
  async (req: Request, res: Response) => {
    const gymId = getGymId(req, res);

    if (!gymId) return;

    const user = await userService.getUserById(
      gymId,
      req.params.id as string
    );

    return successResponse(
      res,
      "User fetched successfully",
      user,
      200
    );
  }
);

export const updateUser = asyncHandler(
  async (req: Request, res: Response) => {
    const gymId = getGymId(req, res);

    if (!gymId || !req.user) return;

    const userId = req.params.id as string;

    const oldUser = await userService.getUserById(
      gymId,
      userId
    );

    const payload = updateUserSchema.parse(req.body);

    const updated = await userService.updateUser(
      gymId,
      userId,
      payload
    );

    await createAuditLog({
      gymId,
      userId: req.user.id,
      action: AuditAction.UPDATE,
      entity: "User",
      entityId: updated.id,
      oldData: oldUser,
      newData: updated,
      ...getRequestMeta(req),
    });

    return successResponse(
      res,
      "User updated successfully",
      updated,
      200
    );
  }
);

export const deleteUser = asyncHandler(
  async (req: Request, res: Response) => {
    const gymId = getGymId(req, res);

    if (!gymId || !req.user) return;

    const userId = req.params.id as string;

    const oldUser = await userService.getUserById(
      gymId,
      userId
    );

    const deleted = await userService.deleteUser(
      gymId,
      userId
    );

    await createAuditLog({
      gymId,
      userId: req.user.id,
      action: AuditAction.DELETE,
      entity: "User",
      entityId: userId,
      oldData: oldUser,
      ...getRequestMeta(req),
    });

    return successResponse(
      res,
      "User deleted successfully",
      deleted,
      200
    );
  }
);