import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { createLogger } from "@rallly/logger";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { env } from "@/env";
import { verifyUploadToken } from "@/lib/storage/image-upload";
import { getS3Client } from "@/lib/storage/s3";
import { isSelfHosted } from "@/utils/constants";

const logger = createLogger("api/storage");

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_UPLOAD_CONTENT_TYPES = new Set(["image/jpeg", "image/png"]);

async function getAvatar(key: string) {
  const s3Client = getS3Client();

  if (!s3Client) {
    throw new Error("S3 client not initialized");
  }

  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error("Object not found");
  }

  const arrayBuffer = await response.Body.transformToByteArray();
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    contentType: response.ContentType || "application/octet-stream",
  };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ key: string[] }> },
) {
  const imageKey = (await context.params).key.join("/");

  if (!imageKey) {
    return new NextResponse("No key provided", { status: 400 });
  }

  try {
    const { buffer, contentType } = await getAvatar(imageKey);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    logger.error({ error, imageKey }, "Failed to fetch object from storage");
    return NextResponse.json(
      { error: "Failed to fetch object" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ key: string[] }> },
) {
  if (!isSelfHosted) {
    return new NextResponse("Not found", { status: 404 });
  }

  const keyParts = (await context.params).key;

  if (keyParts[0] !== "upload" || keyParts.length < 2) {
    return new NextResponse("Not found", { status: 404 });
  }

  const key = keyParts.slice(1).join("/");
  const token = req.nextUrl.searchParams.get("token");

  if (!token || !verifyUploadToken(key, token)) {
    return new NextResponse("Invalid token", { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  if (!ALLOWED_UPLOAD_CONTENT_TYPES.has(contentType)) {
    return new NextResponse("Unsupported content type", { status: 415 });
  }

  const contentLength = Number(req.headers.get("content-length"));

  if (
    !Number.isFinite(contentLength) ||
    contentLength <= 0 ||
    contentLength > MAX_UPLOAD_BYTES
  ) {
    return new NextResponse("Invalid content length", { status: 413 });
  }

  const s3Client = getS3Client();

  if (!s3Client) {
    return new NextResponse("Storage not configured", { status: 500 });
  }

  const arrayBuffer = await req.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_UPLOAD_BYTES) {
    return new NextResponse("Payload too large", { status: 413 });
  }

  if (arrayBuffer.byteLength !== contentLength) {
    return new NextResponse("Content length mismatch", { status: 400 });
  }

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        ContentLength: arrayBuffer.byteLength,
        Body: new Uint8Array(arrayBuffer),
      }),
    );
  } catch (error) {
    logger.error({ error, key }, "Failed to upload object to storage");
    return NextResponse.json(
      { error: "Failed to upload object" },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 200 });
}
