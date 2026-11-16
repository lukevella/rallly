import { createMiddleware } from "hono/factory";
import { getApiPollQuota } from "@/features/api-keys/quota/data";
import type { AuthorizedSpaceId } from "@/features/space/types";
import { isFeatureEnabled } from "@/lib/feature-flags/server";

export type PollQuotaInfo = {
  limit: number;
  used: number;
  resetAt: Date;
};

type PollQuotaEnv = {
  Variables: {
    apiAuth: {
      spaceId: AuthorizedSpaceId;
    };
    pollQuota?: PollQuotaInfo;
  };
};

/**
 * Reports the space's monthly API poll quota and hands it to the create
 * handler, which enforces it. Mounted on poll creation only, so other
 * endpoints do not pay for the read. `used` is the raw count, never clamped
 * to the limit: a lowered limit or an override that expired can leave a
 * space above it. Must run after `spaceApiKeyAuth`.
 */
export const pollQuota = createMiddleware<PollQuotaEnv>(async (c, next) => {
  if (!isFeatureEnabled("apiPollQuota")) {
    await next();
    return;
  }

  const { spaceId } = c.get("apiAuth");
  const { limit, used, resetAt } = await getApiPollQuota({
    spaceId,
    now: new Date(),
  });

  c.set("pollQuota", { limit, used, resetAt });
  c.header("X-Poll-Quota-Limit", limit.toString());
  c.header("X-Poll-Quota-Used", used.toString());
  c.header("X-Poll-Quota-Reset", resetAt.toISOString());

  await next();
});
