import { createLogger } from "@rallly/logger";
import { Redis } from "@upstash/redis";
import { env } from "../env";

const logger = createLogger("api/lib/redis");

function createRedis() {
  if (!env.KV_REST_API_URL || !env.KV_REST_API_TOKEN) {
    return null;
  }

  try {
    return new Redis({
      url: env.KV_REST_API_URL,
      token: env.KV_REST_API_TOKEN,
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
