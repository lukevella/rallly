"use server";

import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@rallly/database";
import { waitUntil } from "@vercel/functions";

import { env } from "@/env";
import { getS3Client } from "@/utils/s3";

const mimeToExtension = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

type SupportedFileType = keyof typeof mimeToExtension;

export async function getPresignedUrl(input: {
  userId: string;
  fileType: SupportedFileType;
  fileSize: number;
}) {
  const s3Client = getS3Client();

  if (!s3Client) {
    throw new Error("Could not initialize S3 client");
  }

  const key = `avatars/${input.userId}_${Date.now()}.${mimeToExtension[input.fileType]}`;

  if (input.fileSize > 2 * 1024 * 1024) {
    throw new Error("File to large");
  }

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
    ContentType: input.fileType,
    ContentLength: input.fileSize,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return {
    url,
    fields: {
      key,
    },
  };
}

export async function updateAvatar(input: { userId: string; image: string }) {
  const user = await prisma.user.findUnique({
    where: {
      id: input.userId,
    },
    select: {
      image: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.image && !user.image.startsWith("https://")) {
    const s3Client = getS3Client();

    if (s3Client) {
      waitUntil(
        s3Client.send(
          new DeleteObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: user.image,
          }),
        ),
      );
    }
  }

  await prisma.user.update({
    where: {
      id: input.userId,
    },
    data: {
      image: input.image,
    },
  });
}

export async function removeAvatar(input: { userId: string }) {
  await prisma.user.update({
    where: {
      id: input.userId,
    },
    data: {
      image: null,
    },
  });
}
