import { EmailClient } from "@rallly/emails";
import * as trpcNext from "@trpc/server/adapters/next";

import { appRouter } from "../../trpc/routers";

export interface TRPCContext {
  user: { id: string; isGuest: boolean };
  emailClient: EmailClient;
  isSelfHosted: boolean;
  isEmailBlocked?: (email: string) => boolean;
  /**
   * Takes a relative path and returns an absolute URL to the app
   * @param path
   * @returns absolute URL
   */
  absoluteUrl: (path?: string) => string;
  shortUrl: (path?: string) => string;
}

export const trpcNextApiHandler = (context: TRPCContext) => {
  return trpcNext.createNextApiHandler({
    router: appRouter,
    createContext: async () => {
      return context;
    },
  });
};
