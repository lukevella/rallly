import "./globals.css";

import { supportedLngs } from "@rallly/languages";
import { PostHogProvider } from "@rallly/posthog/client";
import { Toaster } from "@rallly/ui/sonner";
import { TooltipProvider } from "@rallly/ui/tooltip";
import { domAnimation, LazyMotion } from "motion/react";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import type React from "react";
import type { Params } from "@/app/[locale]/types";
import { BrandingProvider } from "@/features/branding/client";
import { getInstanceBrandingConfig } from "@/features/branding/queries";
import { ThemeProvider } from "@/features/theme/client";
import { I18nProvider } from "@/i18n/client";
import { initI18next } from "@/i18n/i18n";
import { FeatureFlagsProvider } from "@/lib/feature-flags/client";
import { featureFlagConfig } from "@/lib/feature-flags/config";
import { TRPCProvider } from "@/trpc/client/provider";
import { getForegroundColor } from "@/utils/color";
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

async function loadData(locale: string) {
  const [brandingConfig, { i18n }] = await Promise.all([
    getInstanceBrandingConfig(),
    initI18next({ lng: locale }),
  ]);

  return {
    resources: i18n.store.data,
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

  if (!supportedLngs.includes(locale)) {
    notFound();
  }

  const { brandingConfig, resources } = await loadData(locale);

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
              <I18nProvider locale={locale} resources={resources}>
                <TRPCProvider>
                  <LazyMotion features={domAnimation}>
                    <PostHogProvider>
                      <PostHogPageView />
                      <TooltipProvider>{children}</TooltipProvider>
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
