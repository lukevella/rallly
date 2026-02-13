import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";

import { getSession } from "@/lib/auth";

import type { TRPCContext } from "../context";
import { appRouter } from "../routers";

/**
 * Server-Side Helper for public data fetching
 * @description Use for prefetching public data on the server. Does not include
 * session context, allowing the page to be cached. Use createAuthenticatedSSRHelper
 * for pages that need auth context.
 * @see https://trpc.io/docs/client/nextjs/server-side-helpers#1-internal-router
 */
export const createSSRHelper = () => {
  return createServerSideHelpers({
    router: appRouter,
    ctx: {} satisfies TRPCContext,
    transformer: superjson,
  });
};

/**
 * Authenticated Server-Side Helper
 * @description Use for prefetching data that requires session context.
 * Note: Using this makes the page dynamic (not cached).
 * @see https://trpc.io/docs/client/nextjs/server-side-helpers#1-internal-router
 */
export const createAuthenticatedSSRHelper = async () => {
  const session = await getSession();

  return createServerSideHelpers({
    router: appRouter,
    ctx: {
      user: session?.user
        ? {
            id: session.user.id,
            isGuest: session.user.isGuest,
            locale: session.user.locale ?? undefined,
            image: session.user.image ?? undefined,
            isLegacyGuest: session.legacy && session.user.isGuest,
          }
        : undefined,
    } satisfies TRPCContext,
    transformer: superjson,
  });
};
