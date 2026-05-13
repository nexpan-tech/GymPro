import { Request, Response } from "express";
import * as userService from "./user.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.user.gymId) {
    return res.status(400).json({ success: false, message: "Gym ID required" });
  }

  const gymId = req.user.gymId;

  const user = await userService.createUser(gymId, req.body);

  return successResponse(res, "User created successfully", user, 201);
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.user.gymId) {
    return res.status(400).json({ success: false, message: "Gym ID required" });
  }

  if (!req.user.gymId) {
    return res.status(400).json({ success: false, message: "Gym ID required" });
  }

  const gymId = req.user.gymId;

  const users = await userService.getUsers(gymId);

  return successResponse(res, "Users fetched successfully", users, 200);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.user.gymId) {
    return res.status(400).json({ success: false, message: "Gym ID required" });
  }

  const gymId = req.user.gymId;
  const id = req.params.id as string;

  const user = await userService.getUserById(gymId, id);

  return successResponse(res, "User fetched successfully", user, 200);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.user.gymId) {
    return res.status(400).json({ success: false, message: "Gym ID required" });
  }

  const gymId = req.user.gymId;
  const id = req.params.id as string;

  const updated = await userService.updateUser(gymId, id, req.body);

  return successResponse(res, "User updated successfully", updated, 200);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!req.user.gymId) {
    return res.status(400).json({ success: false, message: "Gym ID required" });
  }

  const gymId = req.user.gymId;
  const id = req.params.id as string;

  await userService.deleteUser(gymId, id);

  return successResponse(res, "User deleted successfully", null, 200);
});