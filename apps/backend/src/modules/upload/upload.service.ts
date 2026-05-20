import { cloudinary } from "../../config/cloudinary";

export function uploadBufferToCloudinary(
  fileBuffer: Buffer,
  folder: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) {
          reject(error);
          return;
        }

        resolve(result.secure_url);
      }
    );

    stream.end(fileBuffer);
  });
}