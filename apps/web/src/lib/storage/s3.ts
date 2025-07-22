import { S3Client } from "@aws-sdk/client-s3";

import { env } from "@/env";

export function getS3Client() {
  if (
    !env.S3_BUCKET_NAME ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY
  ) {
    return null;
  }

  const s3Client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    // S3 compatible storage requires path style
    forcePathStyle: true,
  });

  return s3Client;
}
