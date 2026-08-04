import { createServerSideHelpers } from "@trpc/react-query/server";
import { cache } from "react";
import superjson from "superjson";
import { requireUser } from "@/features/user/loaders";
import { getSession } from "@/lib/auth";
import type { TRPCContext } from "../context";
import { appRouter } from "../routers";

/**
 * Public Server-Side Helper
 * @description Use for prefetching data with optional session context.
 * Includes the session if available but does not require authentication.
 * Note: Using this makes the page dynamic (not cached).
 * @see https://trpc.io/docs/client/nextjs/server-side-helpers#1-internal-router
 */
export const createPublicSSRHelper = cache(async () => {
  const user = (await getSession())?.user;

  return createServerSideHelpers({
    router: appRouter,
    ctx: {
      user,
    } satisfies TRPCContext,
    transformer: superjson,
  });
});

/**
 * Private Server-Side Helper
 * @description Use for prefetching data that requires a logged-in (non-guest) user.
 * Redirects to /login if the user is not authenticated or is a guest.
 */
export const createPrivateSSRHelper = cache(async () => {
  const user = await requireUser();

  return createServerSideHelpers({
    router: appRouter,
    ctx: {
      user,
    } satisfies TRPCContext,
    transformer: superjson,
  });
});
