import "tailwindcss/tailwind.css";
import "../../style.css";

import { defaultLocale, supportedLngs } from "@rallly/languages";
import { PostHogProvider } from "@rallly/posthog/client";
import { Toaster } from "@rallly/ui/toaster";
import { TooltipProvider } from "@rallly/ui/tooltip";
import { domAnimation, LazyMotion } from "motion/react";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import React from "react";

import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { UserProvider } from "@/components/user-provider";
import { getUser } from "@/data/get-user";
import { TimezoneProvider } from "@/features/timezone/client/context";
import { I18nProvider } from "@/i18n/client";
import { getLocale } from "@/i18n/server/get-locale";
import { auth, getUserId } from "@/next-auth";
import { TRPCProvider } from "@/trpc/client/provider";
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
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  let locale = getLocale();

  const userId = await getUserId();

  const user = userId ? await getUser() : null;

  if (user?.locale) {
    locale = user.locale;
  }

  if (!supportedLngs.includes(locale)) {
    locale = defaultLocale;
  }

  return (
    <html lang={locale} className={inter.className}>
      <body>
        <Toaster />
        <I18nProvider locale={locale}>
          <TRPCProvider>
            <LazyMotion features={domAnimation}>
              <PostHogProvider>
                <PostHogPageView />
                <TooltipProvider>
                  <UserProvider
                    user={{
                      id: user?.id ?? session?.user?.id ?? "",
                      name: user?.name ?? session?.user?.name ?? "",
                      email: user?.email ?? session?.user?.email ?? undefined,
                      tier: user ? (user.isPro ? "pro" : "hobby") : "guest",
                      timeZone:
                        user?.timeZone ?? session?.user?.timeZone ?? undefined,
                      timeFormat: session?.user?.timeFormat ?? undefined,
                      weekStart: session?.user?.weekStart ?? undefined,
                      image: session?.user?.image ?? undefined,
                      locale: session?.user?.locale ?? undefined,
                    }}
                  >
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
            </LazyMotion>
          </TRPCProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
