import { createServerSideHelpers } from "@trpc/react-query/server";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import superjson from "superjson";
import { isInitialAdmin } from "@/features/setup/utils";
import { getCurrentUser } from "@/features/user/data";
import { getSession, requireUser } from "@/lib/auth";
import { getPathname } from "@/lib/pathname";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";
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

/**
 * Admin Server-Side Helper
 * @description Use for prefetching data that requires an admin user.
 * Redirects to /login if not authenticated, to /admin-setup if the user
 * is the initial admin but not yet promoted, or returns 404 if the user
 * is not an admin.
 */
export const createAdminSSRHelper = cache(async () => {
  // Admin access must be authorized against the database — the session
  // cookie cache can hold a stale role. getCurrentUser also rejects
  // banned users and returns null for guests.
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      buildSafeRedirectUrl({
        destination: "/login",
        returnUrl: await getPathname(),
      }),
    );
  }

  if (user.role !== "admin") {
    if (isInitialAdmin(user.email)) {
      redirect("/admin-setup");
    }

    notFound();
  }

  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: {
      user,
    } satisfies TRPCContext,
    transformer: superjson,
  });

  return { helpers, user };
});
