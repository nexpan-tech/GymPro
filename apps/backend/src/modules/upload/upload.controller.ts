import { Request, Response } from "express";
import { uploadBufferToCloudinary } from "./upload.service";

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