import { createWideEvent } from "@rallly/logger";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import superjson from "superjson";
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
export const createPublicSSRHelper = async () => {
  const session = await getSession();
  const event = createWideEvent({
    service: "trpc",
  });

  return createServerSideHelpers({
    router: appRouter,
    ctx: {
      user: session?.user
        ? {
            id: session.user.id,
            isGuest: session.user.isGuest,
            locale: session.user.locale ?? undefined,
            image: session.user.image ?? undefined,
            timeZone: session.user.timeZone ?? undefined,
            isLegacyGuest: session.legacy && session.user.isGuest,
          }
        : undefined,
      event,
    } satisfies TRPCContext,
    transformer: superjson,
  });
};

/**
 * Private Server-Side Helper
 * @description Use for prefetching data that requires a logged-in (non-guest) user.
 * Redirects to /login if the user is not authenticated or is a guest.
 */
export const createPrivateSSRHelper = async () => {
  const session = await getSession();

  if (!session?.user || session.user.isGuest) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? "/";
    const searchParams = new URLSearchParams();
    searchParams.set("redirectTo", pathname);
    redirect(`/login?${searchParams.toString()}`);
  }

  const event = createWideEvent({
    service: "trpc",
  });

  return createServerSideHelpers({
    router: appRouter,
    ctx: {
      user: {
        id: session.user.id,
        isGuest: false,
        locale: session.user.locale ?? undefined,
        image: session.user.image ?? undefined,
        timeZone: session.user.timeZone ?? undefined,
        isLegacyGuest: false,
      },
      event,
    } satisfies TRPCContext,
    transformer: superjson,
  });
};
