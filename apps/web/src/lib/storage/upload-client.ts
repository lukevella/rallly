import { AppError } from "@/lib/errors";

export interface UploadImageParams {
  file: File;
  url: string;
  fileType: "image/jpeg" | "image/png";
}

export async function uploadImage({
  file,
  url,
  fileType,
}: UploadImageParams): Promise<void> {
  const response = await fetch(url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": fileType,
      "Content-Length": file.size.toString(),
    },
  });

  if (!response.ok) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to upload image to storage",
    });
  }
}
