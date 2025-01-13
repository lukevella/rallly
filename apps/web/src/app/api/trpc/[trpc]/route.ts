import * as Sentry from "@sentry/nextjs";
import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { ipAddress } from "@vercel/functions";

import { getServerSession } from "@/auth";
import type { TRPCContext } from "@/trpc/context";
import { appRouter } from "@/trpc/routers";
import { getEmailClient } from "@/utils/emails";

const handler = (request: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async () => {
      const session = await getServerSession();

      if (!session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        });
      }

      return {
        user: {
          id: session.user.id,
          isGuest: session.user.email === null,
          locale: session.user.locale ?? undefined,
          image: session.user.image ?? undefined,
          email: session.user.email ?? undefined,
          getEmailClient: () =>
            getEmailClient(session.user?.locale ?? undefined),
        },
        ip: ipAddress(request) ?? undefined,
      } satisfies TRPCContext;
    },
    onError({ error }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        Sentry.captureException(error);
      }
    },
  });
};

export { handler as GET, handler as POST };
