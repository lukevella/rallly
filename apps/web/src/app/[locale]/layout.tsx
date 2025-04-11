import "tailwindcss/tailwind.css";
import "../../style.css";

import { PostHogProvider } from "@rallly/posthog/client";
import { Toaster } from "@rallly/ui/toaster";
import { TooltipProvider } from "@rallly/ui/tooltip";
import { dehydrate, Hydrate } from "@tanstack/react-query";
import { domAnimation, LazyMotion } from "motion/react";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import React from "react";

import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { UserProvider } from "@/components/user-provider";
import { TimezoneProvider } from "@/features/timezone";
import { I18nProvider } from "@/i18n/client";
import { auth } from "@/next-auth";
import { TRPCProvider } from "@/trpc/client/provider";
import { createSSRHelper } from "@/trpc/server/create-ssr-helper";
import { ConnectedDayjsProvider } from "@/utils/dayjs";

import { PostHogPageView } from "../posthog-page-view";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function Root({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await auth();
  const trpc = await createSSRHelper();
  await trpc.user.subscription.prefetch();

  return (
    <html lang={locale} className={inter.className}>
      <body>
        <Toaster />
        <I18nProvider>
          <TRPCProvider>
            <Hydrate state={dehydrate(trpc.queryClient)}>
              <LazyMotion features={domAnimation}>
                <SessionProvider session={session}>
                  <PostHogProvider>
                    <PostHogPageView />
                    <TooltipProvider>
                      <UserProvider>
                        <TimezoneProvider
                          initialTimezone={session?.user?.timeZone ?? undefined}
                        >
                          <ConnectedDayjsProvider>
                            {children}
                            <TimeZoneChangeDetector />
                          </ConnectedDayjsProvider>
                        </TimezoneProvider>
                      </UserProvider>
                    </TooltipProvider>
                  </PostHogProvider>
                </SessionProvider>
              </LazyMotion>
            </Hydrate>
          </TRPCProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
