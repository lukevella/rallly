import "tailwindcss/tailwind.css";
import "../../style.css";

import { PostHogProvider } from "@rallly/posthog/client";
import { Toaster } from "@rallly/ui/toaster";
import { TooltipProvider } from "@rallly/ui/tooltip";
import { domAnimation, LazyMotion } from "motion/react";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
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
import { defaultLocale, supportedLngs } from "@rallly/languages";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

async function loadLocale() {
  let locale = getLocale();

  const userId = await getUserId();

  if (userId) {
    const user = await getUser();
    if (user.locale) {
      locale = user.locale;
    }
  }

  if (!supportedLngs.includes(locale)) {
    return defaultLocale;
  }

  return locale;
}

export default async function Root({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const locale = await loadLocale();

  return (
    <html lang={locale} className={inter.className}>
      <body>
        <Toaster />
        <I18nProvider locale={locale}>
          <TRPCProvider>
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
          </TRPCProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
