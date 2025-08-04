import { env } from "@/env";

export const isStorageEnabled = Boolean(
  env.S3_BUCKET_NAME && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY,
);
