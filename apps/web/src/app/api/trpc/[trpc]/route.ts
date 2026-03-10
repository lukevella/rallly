import { createWideEvent, logger } from "@rallly/logger";
import * as Sentry from "@sentry/nextjs";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { ipAddress } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { getUserSession } from "@/features/user/data";
import { getLocaleFromRequest } from "@/lib/locale/server";
import type { TRPCContext } from "@/trpc/context";
import { appRouter } from "@/trpc/routers";
import { withPostHog } from "@/utils/posthog";

const handler = async (req: NextRequest) => {
  const { user } = await getUserSession();
  const ip = ipAddress(req) ?? "127.0.0.1";
  const ja4Digest = req.headers.get("x-vercel-ja4-digest") ?? undefined;
  const reqLocale = getLocaleFromRequest(req);
  const startTime = Date.now();
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
  if (user) {
    event.userId = user.id;
    event.isGuest = user.isGuest;
  }

  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: async () => {
        const locale = user?.locale ?? reqLocale;

        const identifier = user?.id ?? ja4Digest ?? ip;

        return {
          user,
          locale,
          identifier,
          event,
        } satisfies TRPCContext;
      },
      onError: ({ error }) => {
        const statusCode = getHTTPStatusCodeFromError(error);
        event.statusCode = statusCode;
        event.errorCode = error.code;
        event.errorMessage = error.message;
        event.errorType = "TRPCError";

        if (statusCode >= 500) {
          Sentry.captureException(error);
        }
      },
    });

    event.statusCode = response.status;

    return response;
  } catch (error) {
    event.statusCode = 500;
    event.errorType = "Unhandled Error";
    event.errorCode = "INTERNAL_SERVER_ERROR";
    event.errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    throw error;
  } finally {
    event.durationMs = Date.now() - startTime;
    if (event.statusCode && event.statusCode >= 500) {
      logger.error(event);
    } else if (event.statusCode && event.statusCode >= 400) {
      logger.warn(event);
    } else {
      logger.info(event);
    }
  }
};

const handlerWithPostHog = withPostHog(handler);

export { handlerWithPostHog as GET, handlerWithPostHog as POST };
