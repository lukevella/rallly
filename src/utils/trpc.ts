import { MutationCache } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { createReactQueryHooks } from "@trpc/react-query";
import toast from "react-hot-toast";
import superjson from "superjson";

import { AppRouter } from "../server/routers/_app";

export const trpc = createReactQueryHooks<AppRouter>();

export const trpcNext = createTRPCNext<AppRouter>({
  unstable_overrides: {
    useMutation: {
      async onSuccess(opts) {
        /**
         * @note that order here matters:
         * The order here allows route changes in `onSuccess` without
         * having a flash of content change whilst redirecting.
         **/
        await opts.originalFn();
        await opts.queryClient.invalidateQueries();
      },
    },
  },
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
