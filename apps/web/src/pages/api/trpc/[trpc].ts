import { createTRPCContext } from "@rallly/backend/trpc/context";
import { AppRouter, appRouter } from "@rallly/backend/trpc/routers";
import * as Sentry from "@sentry/nextjs";
import { createNextApiHandler } from "@trpc/server/adapters/next";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

import { posthog, posthogApiHandler } from "@/app/posthog";
import { absoluteUrl, shortUrl } from "@/utils/absolute-url";
import { getServerSession, isEmailBlocked } from "@/utils/auth";
import { isSelfHosted } from "@/utils/constants";
import { emailClient } from "@/utils/emails";
import { composeApiHandlers } from "@/utils/next";

const ratelimit = new Ratelimit({
  redis: kv,
  // 5 requests from the same user in 10 seconds
  limiter: Ratelimit.slidingWindow(5, "10 s"),
});

export const config = {
  api: {
    externalResolver: true,
  },
};

const trpcApiHandler = createNextApiHandler<AppRouter>({
  router: appRouter,
  createContext: async (opts) => {
    const res = createTRPCContext(opts, {
      async getUser({ req, res }) {
        const session = await getServerSession(req, res);

        if (!session) {
          return null;
        }

        return {
          id: session.user.id,
          isGuest: session.user.email === null,
        };
      },
      posthogClient: posthog || undefined,
      emailClient,
      isSelfHosted,
      isEmailBlocked,
      absoluteUrl,
      shortUrl,
      ratelimit: async (key: string) => {
        if (!process.env.KV_REST_API_URL) {
          return { success: true };
        }
        return ratelimit.limit(key);
      },
    });

    return res;
  },
  onError({ error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      Sentry.captureException(error);
    }
  },
});

export default composeApiHandlers(trpcApiHandler, posthogApiHandler);
