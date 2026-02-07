export const isRateLimitEnabled =
  process.env.NODE_ENV !== "test" && !!process.env.KV_REST_API_URL;
