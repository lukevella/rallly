import languages from "@rallly/languages";
import type { Viewport } from "next";
import { cacheLife } from "next/cache";

import { LandingShell } from "../../(main)/landing-shell";

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

  return (
    <LandingShell locale={locale} ctaVariant="create-free-poll">
      {children}
    </LandingShell>
  );
}
