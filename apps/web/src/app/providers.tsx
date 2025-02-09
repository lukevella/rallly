"use client";
import { PostHogProvider } from "@rallly/posthog/client";
import { TooltipProvider } from "@rallly/ui/tooltip";
import { domMax, LazyMotion } from "framer-motion";

import { UserProvider } from "@/components/user-provider";
import { I18nProvider } from "@/i18n/client";
import { TRPCProvider } from "@/trpc/client/provider";
import { ConnectedDayjsProvider } from "@/utils/dayjs";

import { PostHogPageView } from "./posthog-page-view";

export function Providers(props: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax}>
      <I18nProvider>
        <PostHogProvider>
          <PostHogPageView />
          <TRPCProvider>
            <TooltipProvider>
              <UserProvider>
                <ConnectedDayjsProvider>
                  {props.children}
                </ConnectedDayjsProvider>
              </UserProvider>
            </TooltipProvider>
          </TRPCProvider>
        </PostHogProvider>
      </I18nProvider>
    </LazyMotion>
  );
}
