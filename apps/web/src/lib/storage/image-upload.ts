import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/env";
import { AppError } from "@/lib/errors";
import { getS3Client } from "./s3";

const mimeToExtension = {
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

export interface GetImageUploadUrlParams {
  keyPrefix: string;
  entityId: string;
  fileType: "image/jpeg" | "image/png";
  fileSize: number;
}

export async function getImageUploadUrl({
  keyPrefix,
  entityId,
  fileType,
  fileSize,
}: GetImageUploadUrlParams) {
  const s3Client = getS3Client();

  if (!s3Client) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      message: "S3 storage has not been configured",
    });
  }

  if (fileSize > 2 * 1024 * 1024) {
    throw new AppError({
      code: "PAYLOAD_TOO_LARGE",
      message: "File size too large",
    });
  }

  const key = `${keyPrefix}/${entityId}-${Date.now()}.${mimeToExtension[fileType]}`;

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    ContentLength: fileSize,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return {
    success: true,
    url,
    fields: {
      key,
    },
  } as const;
}

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

export async function deleteImageFromS3(imageKey: string) {
  const s3Client = getS3Client();

  s3Client?.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: imageKey,
    }),
  );
}
