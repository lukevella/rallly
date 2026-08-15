"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Trans } from "react-i18next/TransWithoutContext";
import Bonus from "@/components/home/bonus";
import { FinalCta } from "@/components/home/final-cta";
import { MarketingHero } from "@/components/home/hero";
import { HeroDemo } from "@/components/home/hero-demo/hero-demo";
import { BigTestimonial, Marketing, MentionedBy } from "@/components/marketing";
import { getTranslation } from "@/i18n/server";

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  cacheLife("days");
  const { locale } = await props.params;
  const { t } = await getTranslation(locale, ["home"]);
  return (
    <Marketing>
      <MarketingHero
        demo={<HeroDemo locale={locale} />}
        title={t("when2meetAlternative", {
          ns: "home",
        })}
        description={t("when2meetAlternativeDescription", {
          ns: "home",
        })}
        callToAction={<Trans t={t} ns="home" i18nKey="createASchedulingPoll" />}
      />
      <Bonus locale={locale} />
      <BigTestimonial />
      <MentionedBy />
      <FinalCta
        title={
          <Trans
            t={t}
            ns="home"
            i18nKey="when2meetAlternativeFinalCtaTitle"
            defaults="Ready for a fresh take on When2Meet?"
          />
        }
        description={
          <Trans
            t={t}
            ns="home"
            i18nKey="when2meetAlternativeFinalCtaDescription"
            defaults="Create a poll in seconds and enjoy a cleaner way to find a time that works."
          />
        }
        callToAction={<Trans t={t} ns="home" i18nKey="createASchedulingPoll" />}
      />
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
    title: t("when2meetAlternativeMetaTitle", {
      ns: "home",
    }),
    description: t("when2meetAlternativeMetaDescription", {
      ns: "home",
    }),
  };
}
