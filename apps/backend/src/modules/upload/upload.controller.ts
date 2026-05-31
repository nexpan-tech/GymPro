import { Request, Response } from "express";
import { uploadBufferToCloudinary } from "./upload.service";
import { ProgressService } from "../progress/progress.service";

export async function uploadFile(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const folder = req.body.folder || "gympro/uploads";

  const url = await uploadBufferToCloudinary(req.file.buffer, folder);

  return res.status(201).json({
    success: true,
    message: "File uploaded successfully",
    data: {
      url,
    },
  });
}

/**
 * Upload a progress photo (mobile). Stores the image in Cloudinary and
 * persists a ProgressPhoto record for the authenticated member.
 * Expects multipart field "photo" plus optional "note".
 */
export async function uploadProgressPhoto(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No photo uploaded",
    });
  }

  const imageUrl = await uploadBufferToCloudinary(
    req.file.buffer,
    "gympro/progress-photos"
  );

  const note = typeof req.body.note === "string" ? req.body.note : undefined;

  const photo = await ProgressService.createPhoto(req.user, imageUrl, note);

  return res.status(201).json({
    success: true,
    message: "Progress photo uploaded successfully",
    data: {
      id: photo.id,
      imageUrl: photo.imageUrl,
    },
  });
}