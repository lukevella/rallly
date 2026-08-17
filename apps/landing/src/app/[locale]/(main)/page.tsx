"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Cta } from "@/components/home/cta";
import { Hero } from "@/components/home/hero";
import { Mentions } from "@/components/home/mentions";
import { Stats } from "@/components/home/stats";
import { Testimonial } from "@/components/home/testimonial";
import { getTranslation } from "@/i18n/server";

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  cacheLife("days");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, ["home", "common"]);
  return (
    <div className="divide-y">
      <Hero
        locale={locale}
        title={t("headline", {
          defaultValue: "Find the best time to meet",
          ns: "home",
        })}
        description={t("subheading", {
          defaultValue:
            "Coordinate group meetings without the back-and-forth emails",
          ns: "home",
        })}
      />
      <Stats locale={locale} />
      <Testimonial locale={locale} />
      <Mentions locale={locale} />
      <Cta locale={locale} />
    </div>
  );
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
  };
}
