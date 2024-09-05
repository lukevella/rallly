import * as Sentry from "@sentry/nextjs";
import { createNextApiHandler } from "@trpc/server/adapters/next";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import requestIp from "request-ip";

import { posthog, posthogApiHandler } from "@/app/posthog";
import { createTRPCContext } from "@/trpc/context";
import { AppRouter, appRouter } from "@/trpc/routers";
import { absoluteUrl, shortUrl } from "@/utils/absolute-url";
import { getServerSession, isEmailBlocked } from "@/utils/auth";
import { isSelfHosted } from "@/utils/constants";
import { getEmailClient } from "@/utils/emails";
import { composeApiHandlers } from "@/utils/next";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
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
          locale: session.user.locale ?? undefined,
          getEmailClient: () =>
            getEmailClient(session.user.locale ?? undefined),
        };
      },
      posthogClient: posthog || undefined,
      isSelfHosted,
      isEmailBlocked,
      absoluteUrl,
      getEmailClient,
      shortUrl,
      ratelimit: async () => {
        if (!process.env.KV_REST_API_URL) {
          return { success: true };
        }

        const clientIp = requestIp.getClientIp(opts.req);

        if (!clientIp) {
          return { success: false };
        }

        return ratelimit.limit(clientIp);
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
