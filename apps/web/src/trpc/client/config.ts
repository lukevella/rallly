import * as Sentry from "@sentry/browser";
import { MutationCache } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

export const trpcConfig = {
  links: [
    httpBatchLink({
      url: "/api/trpc",
    }),
  ],
  transformer: superjson,
  queryClientConfig: {
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: Infinity,
        staleTime: 1000 * 60,
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        Sentry.captureException(error);
      },
    }),
  },
};
