import { createServerSideHelpers } from "@trpc/react-query/server";
import { redirect } from "next/navigation";
import superjson from "superjson";

import { auth } from "@/next-auth";
import { getEmailClient } from "@/utils/emails";

import type { TRPCContext } from "../context";
import { appRouter } from "../routers";

async function createContext(): Promise<TRPCContext> {
  const session = await auth();
  return {
    user: session?.user
      ? {
          id: session.user.id,
          isGuest: !session.user.email,
          locale: session.user.locale ?? undefined,
          image: session.user.image ?? undefined,
          getEmailClient: () =>
            getEmailClient(session.user?.locale ?? undefined),
        }
      : undefined,
  };
}

/**
 * Server-Side Helper
 * @description use this function to call tRPC procedures server-side and hydrate `react-query`'s cache
 * @see https://trpc.io/docs/client/nextjs/server-side-helpers#1-internal-router
 */
export const createSSRHelper = async () => {
  try {
    return createServerSideHelpers({
      router: appRouter,
      ctx: await createContext(),
      transformer: superjson,
    });
  } catch (error) {
    return redirect("/login");
  }
};
