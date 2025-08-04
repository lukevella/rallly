import "../../style.css";

import { supportedLngs } from "@rallly/languages";
import { PostHogIdentify, PostHogProvider } from "@rallly/posthog/client";
import { Toaster } from "@rallly/ui/sonner";
import { TooltipProvider } from "@rallly/ui/tooltip";
import { domAnimation, LazyMotion } from "motion/react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type React from "react";

import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import { requireUser } from "@/auth/data";
import { UserProvider } from "@/components/user-provider";
import { PreferencesProvider } from "@/contexts/preferences";
import type { UserDTO } from "@/features/user/schema";
import { I18nProvider } from "@/i18n/client";
import { getLocale } from "@/i18n/server/get-locale";
import { FeatureFlagsProvider } from "@/lib/feature-flags/client";
import { featureFlagConfig } from "@/lib/feature-flags/config";
import { TimezoneProvider } from "@/lib/timezone/client/context";
import { auth } from "@/next-auth";
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
  maximumScale: 1,
};

async function loadData() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);

  const user = session?.user
    ? !session.user.isGuest
      ? await requireUser()
      : ({
          id: session.user.id,
          name: "Guest",
          isGuest: true,
          email: `${session.user.id}@rallly.co`,
          role: "user",
          locale: session.user.locale ?? undefined,
          timeZone: session.user.timeZone ?? undefined,
          timeFormat: session.user.timeFormat ?? undefined,
          weekStart: session.user.weekStart ?? undefined,
        } satisfies UserDTO)
    : null;

  return {
    session,
    locale,
    user,
  };
}

export default async function Root({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale: fallbackLocale, user } = await loadData();

  let locale = fallbackLocale;

  if (user?.locale) {
    locale = user.locale;
  }

  if (!supportedLngs.includes(locale)) {
    locale = fallbackLocale;
  }

  return (
    <html lang={locale} className={inter.className}>
      <body>
        <FeatureFlagsProvider value={featureFlagConfig}>
          <Toaster />
          <I18nProvider locale={locale}>
            <TRPCProvider>
              <LazyMotion features={domAnimation}>
                <PostHogProvider>
                  <PostHogIdentify distinctId={user?.id} />
                  <PostHogPageView />
                  <TooltipProvider>
                    <UserProvider user={user ?? undefined}>
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

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      template: "%s | Rallly",
      default: "Rallly",
    },
  };
}
