"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Trans } from "react-i18next/TransWithoutContext";
import Bonus from "@/components/home/bonus";
import { MarketingHero } from "@/components/home/hero";
import { BigTestimonial, Marketing, MentionedBy } from "@/components/marketing";
import { getTranslation } from "@/i18n/server";
import { ClosingCta } from "./components/closing-cta";
import { Compare } from "./components/compare";
import { Faq } from "./components/faq";
import { Features } from "./components/features";
import { HowItWorks } from "./components/how-it-works";
import { UseCases } from "./components/use-cases";

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  cacheLife("max");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, ["home"]);
  return (
    <Marketing>
      <MarketingHero
        title={t("freeSchedulingPollTitle", {
          ns: "home",
        })}
        description={t("freeSchedulingPollDescription", {
          ns: "home",
        })}
        callToAction={<Trans t={t} ns="home" i18nKey="createASchedulingPoll" />}
      />
      <Bonus locale={locale} />
      <HowItWorks locale={locale} />
      <Features locale={locale} />
      <UseCases locale={locale} />
      <Compare locale={locale} />
      <BigTestimonial />
      <MentionedBy />
      <Faq locale={locale} />
      <ClosingCta locale={locale} />
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
    title: t("freeSchedulingPollMetaTitle", {
      ns: "home",
    }),
    description: t("freeSchedulingPollMetaDescription", {
      ns: "home",
    }),
  };
}
