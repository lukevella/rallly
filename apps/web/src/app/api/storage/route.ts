import { GetObjectCommand } from "@aws-sdk/client-s3";
import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/env";
import { getS3Client } from "@/utils/s3";

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

export async function GET(req: NextRequest) {
  const imageKey = req.nextUrl.searchParams.get("key");

  if (!imageKey) {
    return new Response("No key provided", { status: 400 });
  }

  try {
    const { buffer, contentType } = await getAvatar(imageKey);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "max-age=86400",
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to fetch object" },
      { status: 500 },
    );
  }
}
