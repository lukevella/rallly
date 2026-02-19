import { Redis } from "@upstash/redis";
import { env } from "@/env";

function createRedis() {
  if (!env.KV_REST_API_URL || !env.KV_REST_API_TOKEN) {
    return null;
  }

  try {
    return new Redis({
      url: env.KV_REST_API_URL,
      token: env.KV_REST_API_TOKEN,
    });
  } catch {
    return null;
  }
}

const redis = createRedis();

export { redis };
