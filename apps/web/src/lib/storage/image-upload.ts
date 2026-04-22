import "server-only";
import crypto from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/env";
import { AppError } from "@/lib/errors";
import { isSelfHosted } from "@/utils/constants";
import { getS3Client } from "./s3";

export function signUploadKey(key: string) {
  return crypto
    .createHmac("sha256", env.SECRET_PASSWORD)
    .update(key)
    .digest("hex");
}

export function verifyUploadToken(key: string, token: string) {
  const expected = signUploadKey(key);
  const expectedBuf = Buffer.from(expected, "hex");
  const tokenBuf = Buffer.from(token, "hex");
  if (expectedBuf.length !== tokenBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, tokenBuf);
}

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

  if (isSelfHosted) {
    const token = signUploadKey(key);
    const url = `/api/storage/upload/${key}?token=${token}`;
    return {
      success: true,
      url,
      fields: {
        key,
      },
    } as const;
  }

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

export async function deleteImageFromS3(imageKey: string) {
  const s3Client = getS3Client();

  await s3Client?.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: imageKey,
    }),
  );
}
