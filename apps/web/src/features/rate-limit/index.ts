"server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { headers } from "next/headers";

import { auth } from "@/next-auth";

import { isRateLimitEnabled } from "./constants";

type Unit = "ms" | "s" | "m" | "h" | "d";
type Duration = `${number} ${Unit}` | `${number}${Unit}`;

async function getIPAddress() {
  return headers().get("x-forwarded-for");
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

  const session = await auth();
  const identifier = session?.user?.id || (await getIPAddress());
  try {
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(requests, duration),
    });

    return ratelimit.limit(`${identifier}:${name}`);
  } catch (e) {
    console.error(e);
    return {
      success: true,
    };
  }
}
