export const isStorageEnabled =
  !!process.env.S3_BUCKET_NAME &&
  !!process.env.S3_ACCESS_KEY_ID &&
  !!process.env.S3_SECRET_ACCESS_KEY;
