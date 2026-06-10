import { Request, Response } from "express";
import { AnnouncementService } from "./announcement.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse } from "../../utils/response";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnnouncementService.create(req.user!, req.body);
  return successResponse(res, "Announcement created", data, 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnnouncementService.list(req.user!);
  return successResponse(res, "Announcements", data);
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnnouncementService.listMine(req.user!);
  return successResponse(res, "My announcements", data);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnnouncementService.getById(req.user!, req.params.id as string);
  return successResponse(res, "Announcement", data);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnnouncementService.update(req.user!, req.params.id as string, req.body);
  return successResponse(res, "Announcement updated", data);
});

export const send = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnnouncementService.send(req.user!, req.params.id as string);
  return successResponse(res, "Announcement sent", data);
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnnouncementService.cancel(req.user!, req.params.id as string);
  return successResponse(res, "Announcement cancelled", data);
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const data = await AnnouncementService.markRead(req.user!, req.params.id as string);
  return successResponse(res, "Marked read", data);
});
