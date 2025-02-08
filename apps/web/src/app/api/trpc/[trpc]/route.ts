import * as Sentry from "@sentry/nextjs";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { ipAddress } from "@vercel/functions";
import type { NextRequest } from "next/server";

import { getLocaleFromHeader } from "@/app/guest";
import { getServerSession } from "@/auth";
import type { TRPCContext } from "@/trpc/context";
import { appRouter } from "@/trpc/routers";
import { getEmailClient } from "@/utils/emails";

const handler = (req: NextRequest) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const session = await getServerSession();
      const locale = await getLocaleFromHeader(req);
      const user = session?.user
        ? {
            id: session.user.id,
            isGuest: !session.user.email,
            locale: session.user.locale ?? undefined,
            image: session.user.image ?? undefined,
            getEmailClient: () =>
              getEmailClient(session.user?.locale ?? undefined),
          }
        : undefined;

      return {
        user,
        locale,
        ip: ipAddress(req) ?? undefined,
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
