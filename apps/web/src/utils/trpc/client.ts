import { createTRPCNext } from "@trpc/next";

import type { AppRouter } from "@/trpc/routers";
import { trpcConfig } from "@/utils/trpc/config";

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return trpcConfig;
  },
});
