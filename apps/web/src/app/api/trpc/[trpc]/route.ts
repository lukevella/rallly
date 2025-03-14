import { getPreferredLocale } from "@rallly/languages/get-preferred-locale";
import * as Sentry from "@sentry/nextjs";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { ipAddress } from "@vercel/functions";
import type { NextRequest } from "next/server";

import { auth } from "@/next-auth";
import type { TRPCContext } from "@/trpc/context";
import { appRouter } from "@/trpc/routers";
import { getEmailClient } from "@/utils/emails";

const handler = async (req: NextRequest) => {
  const session = await auth();
  const ip = ipAddress(req);
  const ja4Digest = req.headers.get("x-vercel-ja4-digest");

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const locale = await getPreferredLocale(req);
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

      const ip =
        process.env.NODE_ENV === "development" ? "127.0.0.1" : ipAddress(req);

      const identifier = session?.user?.id ?? ja4Digest ?? ip;

      return {
        user,
        locale,
        identifier,
      } satisfies TRPCContext;
    },
    onError({ error }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        Sentry.captureException(error);
      }
      if (error.code === "TOO_MANY_REQUESTS") {
        console.warn("Too many requests", {
          path: req.nextUrl.pathname,
          userId: session?.user?.id,
          ip,
          ja4Digest,
        });
      }
    },
  });
};

export { handler as GET, handler as POST };
