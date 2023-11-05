"use client";
import { AppRouter } from "@rallly/backend/trpc/routers";
import { TooltipProvider } from "@rallly/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact } from "@trpc/react-query";
import { domMax, LazyMotion } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

import { I18nProvider } from "@/app/i18n/client";
import { UserProvider } from "@/components/user-provider";
import { ConnectedDayjsProvider } from "@/utils/dayjs";
import { trpcConfig } from "@/utils/trpc/config";

export const trpc = createTRPCReact<AppRouter>({
  unstable_overrides: {
    useMutation: {
      async onSuccess(opts) {
        await opts.originalFn();
        await opts.queryClient.invalidateQueries();
      },
    },
  },
});

export function Providers(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => trpc.createClient(trpcConfig));
  return (
    <LazyMotion features={domMax}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <ConnectedDayjsProvider>
              <TooltipProvider>
                <SessionProvider>
                  <UserProvider>{props.children}</UserProvider>
                </SessionProvider>
              </TooltipProvider>
            </ConnectedDayjsProvider>
          </I18nProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </LazyMotion>
  );
}
