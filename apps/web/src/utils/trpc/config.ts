import * as Sentry from "@sentry/browser";
import { MutationCache } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import toast from "react-hot-toast";
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
        toast.error(
          "Uh oh! Something went wrong. The issue has been logged and we'll fix it as soon as possible. Please try again later.",
        );
        Sentry.captureException(error);
      },
    }),
  },
};
