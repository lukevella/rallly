import "./globals.css";

import { PostHogProvider } from "@rallly/posthog/client";
import { Toaster } from "@rallly/ui/sonner";
import { TooltipProvider } from "@rallly/ui/tooltip";
import { domAnimation, LazyMotion } from "motion/react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import { TimeZoneChangeDetector } from "@/app/[locale]/timezone-change-detector";
import type { Params } from "@/app/[locale]/types";
import { requireUser } from "@/auth/data";
import { UserProvider } from "@/components/user-provider";
import { PreferencesProvider } from "@/contexts/preferences";
import { BrandingProvider } from "@/features/branding/client";
import { getInstanceBrandingConfig } from "@/features/branding/queries";
import { ThemeProvider } from "@/features/theme/client";
import type { UserDTO } from "@/features/user/schema";
import { I18nProvider } from "@/i18n/client";
import { getSession } from "@/lib/auth";
import { FeatureFlagsProvider } from "@/lib/feature-flags/client";
import { featureFlagConfig } from "@/lib/feature-flags/config";
import { LocaleSync } from "@/lib/locale/client";
import { TimezoneProvider } from "@/lib/timezone/client/context";
import { TRPCProvider } from "@/trpc/client/provider";
import { getForegroundColor } from "@/utils/color";
import { ConnectedDayjsProvider } from "@/utils/dayjs";
import { PostHogPageView } from "../posthog-page-view";
import { PostHogIdentify } from "./posthog-identify";

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
  const [session, brandingConfig] = await Promise.all([
    getSession(),
    getInstanceBrandingConfig(),
  ]);

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
    user,
    brandingConfig,
  };
}

export default async function Root({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { locale } = await params;
  const { user, brandingConfig } = await loadData();

  const brandingStyles = {
    "--primary-light": brandingConfig.primaryColor.light,
    "--primary-light-foreground": getForegroundColor(
      brandingConfig.primaryColor.light,
    ),
    "--primary-dark": brandingConfig.primaryColor.dark,
    "--primary-dark-foreground": getForegroundColor(
      brandingConfig.primaryColor.dark,
    ),
  } as React.CSSProperties;

  return (
    <html
      lang={locale}
      className={inter.className}
      suppressHydrationWarning={true}
      style={brandingStyles}
    >
      <body>
        <ThemeProvider>
          <FeatureFlagsProvider value={featureFlagConfig}>
            <BrandingProvider value={brandingConfig}>
              <Toaster />
              <I18nProvider locale={locale}>
                <TRPCProvider>
                  <LazyMotion features={domAnimation}>
                    <PostHogProvider>
                      <PostHogIdentify
                        distinctId={user && !user.isGuest ? user.id : undefined}
                      />
                      <PostHogPageView />
                      <TooltipProvider>
                        <UserProvider user={user ?? undefined}>
                          <LocaleSync userLocale={user?.locale ?? locale} />
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
            </BrandingProvider>
          </FeatureFlagsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const brandingConfig = await getInstanceBrandingConfig();

  return {
    title: {
      template: "%s",
      default: brandingConfig.appName,
    },
  };
}
