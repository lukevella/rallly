import * as Sentry from "@sentry/browser";
import { MutationCache } from "@tanstack/react-query";
import { type TRPCLink, httpBatchLink, TRPCClientError } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import superjson from "superjson";

import type { AppRouter } from "../routers";

const errorHandlingLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next: (result) => observer.next(result),
        error: (error) => {
          if (
            error instanceof TRPCClientError &&
            error.data?.code === "UNAUTHORIZED"
          ) {
            window.location.href = "/login";
          }
          observer.error(error);
        },
      });
      return unsubscribe;
    });
  };
};

export const trpcConfig = {
  links: [
    errorHandlingLink,
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
