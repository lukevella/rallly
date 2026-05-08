import { createLogger } from "@rallly/logger";
import { Redis } from "@upstash/redis";

const logger = createLogger("api/lib/redis");

function createRedis() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }

  try {
    return new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  } catch (error) {
    logger.error(
      { error },
      "Redis has been configured but failed to initialize Redis client",
    );
    return null;
  }
}

export const redis = createRedis();
