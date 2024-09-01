import { EmailClient } from "@rallly/emails";
import { inferAsyncReturnType, TRPCError } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";
import type { PostHog } from "posthog-node";

export type GetUserFn = (opts: CreateNextContextOptions) => Promise<{
  id: string;
  isGuest: boolean;
  locale?: string;
  getEmailClient: (locale?: string) => EmailClient;
} | null>;

export interface TRPCContextParams {
  getUser: GetUserFn;
  isSelfHosted: boolean;
  isEmailBlocked?: (email: string) => boolean;
  posthogClient?: PostHog;
  getEmailClient: (locale?: string) => EmailClient;
  /**
   * Takes a relative path and returns an absolute URL to the app
   * @param path
   * @returns absolute URL
   */
  absoluteUrl: (path?: string) => string;
  shortUrl: (path?: string) => string;
  ratelimit: () => Promise<{ success: boolean }>;
}

export const createTRPCContext = async (
  opts: CreateNextContextOptions,
  { getUser, ...params }: TRPCContextParams,
) => {
  const user = await getUser(opts);

  if (!user) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Request has no session",
    });
  }

  return {
    user,
    ...params,
  };
};

export type TRPCContext = inferAsyncReturnType<typeof createTRPCContext>;
