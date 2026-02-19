import { env } from "@/env";

export const isRateLimitEnabled = env.RATE_LIMIT_ENABLED !== "false";
