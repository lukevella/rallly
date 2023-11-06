import { AppRouter } from "@rallly/backend/trpc/routers";
import { createTRPCNext } from "@trpc/next";

import { trpcConfig } from "@/utils/trpc/config";

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return trpcConfig;
  },
});
