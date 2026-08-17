"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { getTranslation } from "@/i18n/server";
import { HomePage } from "../../(main)/home-page";

// The get-started variant of the home page. Only reached via the middleware
// rewrite in lib/cta-experiment.ts — the visitor's URL stays "/".

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  cacheLife("days");
  const { locale } = await props.params;
  return <HomePage locale={locale} ctaVariant="create-free-poll" />;
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  cacheLife("max");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, "home");
  return {
    title: t("metaTitle", {
      defaultValue: "Rallly: Free Group Meeting Scheduling Tool",
      ns: "home",
    }),
    description: t("metaDescription", {
      ns: "home",
      defaultValue:
        "Rallly is the fastest and easiest scheduling and collaboration tool. Create a meeting poll in seconds, no login required.",
    }),
    robots: { index: false, follow: false },
  };
}
