import "../../style.css";

import { defaultLocale, supportedLngs } from "@rallly/languages";
import { PostHogProvider, posthog } from "@rallly/posthog/client";
import { Toaster } from "@rallly/ui/toaster";
import { TooltipProvider } from "@rallly/ui/tooltip";
import { LazyMotion, domAnimation } from "motion/react";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import type React from "react";

import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { UserProvider } from "@/components/user-provider";
import { PreferencesProvider } from "@/contexts/preferences";
import { TimezoneProvider } from "@/features/timezone/client/context";
import { I18nProvider } from "@/i18n/client";
import { getLocale } from "@/i18n/server/get-locale";
import { auth, getUserId } from "@/next-auth";
import { TRPCProvider } from "@/trpc/client/provider";
import { ConnectedDayjsProvider } from "@/utils/dayjs";

import { FeatureFlagsProvider } from "@/features/feature-flags/client";
import { isStorageEnabled } from "@/features/storage";
import { getUser } from "@/features/user/queries";
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

  let locale = await getLocale();

  const userId = await getUserId();

  const user = userId ? await getUser(userId) : null;

  if (user?.locale) {
    locale = user.locale;
  }

  if (!supportedLngs.includes(locale)) {
    locale = defaultLocale;
  }

  return (
    <html lang={locale} className={inter.className}>
      <body>
        <FeatureFlagsProvider value={{ storage: isStorageEnabled }}>
          <Toaster />
          <I18nProvider locale={locale}>
            <TRPCProvider>
              <LazyMotion features={domAnimation}>
                <PostHogProvider client={posthog}>
                  <PostHogPageView />
                  <TooltipProvider>
                    <UserProvider
                      user={
                        user
                          ? {
                              id: user.id,
                              name: user.name,
                              email: user.email,
                              tier: user
                                ? user.isPro
                                  ? "pro"
                                  : "hobby"
                                : "guest",
                              image: user.image,
                              role: user.role,
                            }
                          : session?.user
                            ? {
                                id: session.user.id,
                                tier: "guest",
                                role: "guest",
                              }
                            : undefined
                      }
                    >
                      <PreferencesProvider
                        initialValue={{
                          timeFormat: user?.timeFormat,
                          timeZone: user?.timeZone,
                          weekStart: user?.weekStart,
                        }}
                      >
                        <TimezoneProvider initialTimezone={user?.timeZone}>
                          <ConnectedDayjsProvider>
                            {children}
                            <TimeZoneChangeDetector />
                          </ConnectedDayjsProvider>
                        </TimezoneProvider>
                      </PreferencesProvider>
                    </UserProvider>
                  </TooltipProvider>
                </PostHogProvider>
              </LazyMotion>
            </TRPCProvider>
          </I18nProvider>
        </FeatureFlagsProvider>
      </body>
    </html>
  );
}
