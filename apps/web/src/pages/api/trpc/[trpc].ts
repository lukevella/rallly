import { createTRPCContext } from "@rallly/backend/trpc/context";
import { AppRouter, appRouter } from "@rallly/backend/trpc/routers";
import * as trpcNext from "@trpc/server/adapters/next";

import { absoluteUrl, shortUrl } from "@/utils/absolute-url";
import { getServerSession, isEmailBlocked } from "@/utils/auth";
import { isSelfHosted } from "@/utils/constants";
import { emailClient } from "@/utils/emails";

export const config = {
  api: {
    externalResolver: true,
  },
};

export default trpcNext.createNextApiHandler<AppRouter>({
  router: appRouter,
  createContext: async (opts) => {
    return createTRPCContext(opts, {
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
      emailClient,
      isSelfHosted,
      isEmailBlocked,
      absoluteUrl,
      shortUrl,
    });
  },
});
