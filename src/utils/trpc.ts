import { MutationCache } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { createReactQueryHooks } from "@trpc/react-query";
import toast from "react-hot-toast";
import superjson from "superjson";

import { AppRouter } from "../server/routers/_app";
import { absoluteUrl } from "./absolute-url";

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
  config({ ctx }) {
    return {
      links: [
        httpBatchLink({
          url: absoluteUrl(`/api/trpc`),
          headers() {
            if (ctx?.req) {
              // To use SSR properly, you need to forward the client's headers to the server
              // This is so you can pass through things like cookies when we're server-side rendering
              // If you're using Node 18, omit the "connection" header
              const {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                connection: _connection,
                ...headers
              } = ctx.req.headers;
              return headers;
            }
            return {};
          },
        }),
      ],
      transformer: superjson,
      queryClientConfig: {
        defaultOptions: {
          queries: {
            cacheTime: Infinity,
            staleTime: 30 * 1000, // 30 seconds
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
  ssr: true,
});
