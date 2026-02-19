import { Redis } from "@upstash/redis";

function createRedis() {
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

const redis = createRedis();

export { redis };
