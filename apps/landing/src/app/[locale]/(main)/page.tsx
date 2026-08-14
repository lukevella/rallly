"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Bonus from "@/components/home/bonus";
import { MarketingHero } from "@/components/home/hero";
import { BigTestimonial, Marketing, MentionedBy } from "@/components/marketing";
import { getTranslation } from "@/i18n/server";

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  cacheLife("days");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, ["home", "common"]);
  return (
    <Marketing>
      <MarketingHero
        title={t("headline", {
          defaultValue: "Find the best time to meet",
          ns: "home",
        })}
        description={t("subheading", {
          defaultValue:
            "Coordinate group meetings without the back-and-forth emails",
          ns: "home",
        })}
        callToAction={t("createAPoll", {
          ns: "home",
        })}
      />
      <div className="space-y-8">
        <Bonus locale={locale} />
        <BigTestimonial />
      </div>
      <MentionedBy />
    </Marketing>
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
