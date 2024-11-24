import { createTRPCNext } from "@trpc/next";

import { trpcConfig } from "@/trpc/client/config";
import type { AppRouter } from "@/trpc/routers";

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return trpcConfig;
  },
  unstable_overrides: {
    useMutation: {
      async onSuccess(opts) {
        await opts.originalFn();
        await opts.queryClient.invalidateQueries();
      },
    },
  },
});
