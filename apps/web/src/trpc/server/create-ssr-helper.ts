import { createWideEvent } from "@rallly/logger";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import superjson from "superjson";
import { getUser } from "@/features/user/data";
import { getSession } from "@/lib/auth";
import { getPathname } from "@/lib/pathname";
import { isInitialAdmin } from "@/utils/is-initial-admin";
import { buildSafeRedirectUrl } from "@/utils/redirect";
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
  const session = await getSession();

  const user = session?.user
    ? ((await getUser(session.user.id)) ?? undefined)
    : undefined;

  const event = createWideEvent({
    service: "trpc",
  });

  return createServerSideHelpers({
    router: appRouter,
    ctx: {
      user,
      event,
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
  const session = await getSession();

  if (!session?.user || session.user.isGuest) {
    const pathname = await getPathname();
    redirect(
      buildSafeRedirectUrl({ destination: "/login", returnUrl: pathname }),
    );
  }

  const user = await getUser(session.user.id);

  if (!user) {
    redirect("/api/auth/invalid-session");
  }

  const event = createWideEvent({
    service: "trpc",
  });

  return createServerSideHelpers({
    router: appRouter,
    ctx: {
      user,
      event,
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
  const session = await getSession();

  if (!session?.user || session.user.isGuest) {
    redirect(
      buildSafeRedirectUrl({
        destination: "/login",
        returnUrl: await getPathname(),
      }),
    );
  }

  const user = await getUser(session.user.id);

  if (!user) {
    redirect("/api/auth/invalid-session");
  }

  if (user.role !== "admin") {
    if (isInitialAdmin(user.email)) {
      redirect("/admin-setup");
    }

    notFound();
  }

  const event = createWideEvent({
    service: "trpc",
  });

  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: {
      user,
      event,
    } satisfies TRPCContext,
    transformer: superjson,
  });

  return { helpers, user };
});
