import "./globals.css";

import languages from "@rallly/languages";
import { PostHogInit } from "@rallly/posthog/client";
import { cn } from "@rallly/ui";
import { Analytics } from "@vercel/analytics/react";
import { domAnimation, LazyMotion } from "motion/react";
import type { Metadata, Viewport } from "next";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { display } from "@/fonts/display";
import { sans } from "@/fonts/sans";

export const ensureStatic = "navigation";

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
  "use cache";
  cacheLife("max");
  const { children, params } = props;
  const { locale } = await params;

  // The proxy skips paths containing a dot, so they reach [locale] with the raw
  // path as the locale, e.g. "ads.txt".
  if (!Object.hasOwn(languages, locale)) {
    notFound();
  }

  return (
    // Horizontal overflow is clipped at the viewport, never on an ancestor of
    // a sticky element: Safari repositions sticky elements under an overflow
    // clip on the main thread, so they jitter while scrolling.
    <html
      lang={locale}
      className={cn(sans.className, display.variable, "overflow-x-clip")}
    >
      <body>
        <LazyMotion features={domAnimation}>
          <PostHogInit>{children}</PostHogInit>
          <Analytics />
        </LazyMotion>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: { template: "%s | Rallly", default: "Rallly" },
  metadataBase: process.env.NEXT_PUBLIC_BASE_URL
    ? new URL(process.env.NEXT_PUBLIC_BASE_URL)
    : undefined,
  openGraph: {
    type: "website",
    siteName: "Rallly",
  },
};
