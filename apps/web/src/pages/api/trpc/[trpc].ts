import { posthogApiHandler } from "@rallly/posthog/server";
import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { createNextApiHandler } from "@trpc/server/adapters/next";

import { getServerSession } from "@/auth";
import { getGuestUserFromApiRequest } from "@/auth/next";
import type { AppRouter } from "@/trpc/routers";
import { appRouter } from "@/trpc/routers";
import { getEmailClient } from "@/utils/emails";
import { composeApiHandlers } from "@/utils/next";

export const config = {
  api: {
    externalResolver: true,
  },
};

const trpcApiHandler = createNextApiHandler<AppRouter>({
  router: appRouter,
  createContext: async (opts) => {
    const session = await getServerSession(opts.req, opts.res);
    const guestUser = await getGuestUserFromApiRequest(opts.req);

    const id = session?.user?.id || guestUser?.id;
    const isGuest = !session?.user?.email;
    const locale = session?.user?.locale ?? guestUser?.locale;
    const image = session?.user?.image ?? undefined;

    if (!id) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return {
      user: {
        id,
        isGuest,
        locale,
        image,
        getEmailClient: () => getEmailClient(locale),
      },
      req: opts.req,
      res: opts.res,
    };
  },
  onError({ error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      Sentry.captureException(error);
    }
  },
});

export default composeApiHandlers(trpcApiHandler, posthogApiHandler);
