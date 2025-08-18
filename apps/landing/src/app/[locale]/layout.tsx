import "../../style.css";

import languages from "@rallly/languages";
import { PostHogProvider } from "@rallly/posthog/client";
import { Analytics } from "@vercel/analytics/react";
import { domAnimation, LazyMotion } from "motion/react";
import type { Metadata, Viewport } from "next";
import { PostHogPageView } from "@/components/posthog-page-view";
import { sans } from "@/fonts/sans";
import { I18nProvider } from "@/i18n/client/i18n-provider";
import { getTranslation } from "@/i18n/server";

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

  const { i18n } = await getTranslation(locale);
  const translations = i18n.store.data;

  return (
    <html lang={locale} className={sans.className}>
      <body>
        <LazyMotion features={domAnimation}>
          <PostHogProvider>
            <PostHogPageView />
            <I18nProvider locale={locale} resources={translations}>
              {children}
            </I18nProvider>
          </PostHogProvider>
        </LazyMotion>
        <Analytics />
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL as string),
};
