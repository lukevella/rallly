import "server-only";

import { createLogger } from "@rallly/logger";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { headers } from "next/headers";

import { getSession } from "@/lib/auth";

import { isRateLimitEnabled } from "./constants";

const logger = createLogger("rate-limit");

export type Unit = "ms" | "s" | "m" | "h" | "d";
export type Duration = `${number} ${Unit}` | `${number}${Unit}`;

async function getIPAddress() {
  return (await headers()).get("x-forwarded-for");
}

export async function rateLimit(
  name: string,
  requests: number,
  duration: Duration,
) {
  if (!isRateLimitEnabled) {
    return {
      success: true,
    };
  }

  const session = await getSession();
  const identifier = session?.user?.id || (await getIPAddress());
  try {
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(requests, duration),
    });

    return ratelimit.limit(`${identifier}:${name}`);
  } catch (e) {
    logger.error({ error: e, name }, "Rate limit error");
    return {
      success: true,
    };
  }
}
