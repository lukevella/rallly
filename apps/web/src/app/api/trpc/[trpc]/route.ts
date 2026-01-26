import { createWideEvent, logger } from "@rallly/logger";

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
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
  const ja4Digest = req.headers.get("x-vercel-ja4-digest") ?? undefined;
  const reqLocale = getLocaleFromRequest(req);

  const event = createWideEvent({
    service: "trpc",
    requestId:
      req.headers.get("x-vercel-id") ??
      req.headers.get("x-request-id") ??
      undefined,
    method: req.method,
    path: req.nextUrl.pathname,
    ip,
    ja4Digest,
  });

  // User context
  if (session?.user) {
    event.userId = session.user.id;
    event.isGuest = session.user.isGuest;
  }

  try {
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: async () => {
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

        const identifier = session?.user?.id ?? ja4Digest ?? ip;

        return {
          user,
          locale: user?.locale ?? reqLocale,
          identifier,
        } satisfies TRPCContext;
      },
      onError: ({ error }) => {
        const statusCode = getHTTPStatusCodeFromError(error);
        event.statusCode = statusCode;
        event.errorCode = error.code;
        event.errorMessage = error.message;
        event.errorType = "TRPCError";

        if (statusCode >= 500) {
          logger.error(event);
        } else {
          logger.warn(event);
        }
      },
    });
  } catch (error) {
    event.statusCode = 500;
    event.errorType = "Unhandled Error";
    event.errorCode = "INTERNAL_SERVER_ERROR";
    event.errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    logger.error({ event, error });
    throw error;
  }
};

export { handler as GET, handler as POST };
