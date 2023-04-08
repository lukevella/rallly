import { MutationCache } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import toast from "react-hot-toast";
import superjson from "superjson";

import { AppRouter } from "../../trpc/routers";

export * from "../../trpc/types";

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `/api/trpc`,
        }),
      ],
      transformer: superjson,
      queryClientConfig: {
        defaultOptions: {
          queries: {
            cacheTime: Infinity,
          },
        },
        mutationCache: new MutationCache({
          onError: () => {
            toast.error(
              "Uh oh! Something went wrong. The issue has been logged and we'll fix it as soon as possible. Please try again later.",
            );
          },
        }),
      },
    };
  },
  ssr: false,
});
