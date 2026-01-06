import { getPreferredLocale } from "@rallly/languages/get-preferred-locale";
import * as Sentry from "@sentry/nextjs";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { ipAddress } from "@vercel/functions";
import type { NextRequest } from "next/server";

import { getSession } from "@/lib/auth";
import { getLocaleFromRequest } from "@/lib/locale/server";
import type { TRPCContext } from "@/trpc/context";
import { appRouter } from "@/trpc/routers";
import { getEmailClient } from "@/utils/emails";

const handler = async (req: NextRequest) => {
  const session = await getSession();
  const ip = ipAddress(req);
  const ja4Digest = req.headers.get("x-vercel-ja4-digest");
  const reqLocale = getLocaleFromRequest(req);

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => {
      const locale = getPreferredLocale({
        acceptLanguageHeader: req.headers.get("accept-language") ?? undefined,
      });
      const user = session?.user
        ? {
            id: session.user.id,
            isGuest: session.user.isGuest,
            locale: session.user.locale ?? reqLocale,
            image: session.user.image ?? undefined,
            getEmailClient: async () =>
              await getEmailClient(session.user?.locale ?? undefined),
            isLegacyGuest: session.legacy && session.user.isGuest,
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
