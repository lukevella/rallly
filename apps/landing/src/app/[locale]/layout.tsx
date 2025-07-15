import "../../style.css";

import languages from "@rallly/languages";
import { PostHogProvider } from "@rallly/posthog/client";
import { Analytics } from "@vercel/analytics/react";
import { domAnimation, LazyMotion } from "motion/react";
import type { Viewport } from "next";
import { PostHogPageView } from "@/components/posthog-page-view";
import { sans } from "@/fonts/sans";
import { I18nProvider } from "@/i18n/client/i18n-provider";

export async function generateStaticParams() {
  return Object.keys(languages).map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function Root(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;

  const { locale } = params;

  const { children } = props;

  return (
    <html lang={locale} className={sans.className}>
      <body>
        <LazyMotion features={domAnimation}>
          <I18nProvider locale={locale}>
            <PostHogProvider>
              <PostHogPageView />
              {children}
            </PostHogProvider>
          </I18nProvider>
        </LazyMotion>
        <Analytics />
      </body>
    </html>
  );
}
