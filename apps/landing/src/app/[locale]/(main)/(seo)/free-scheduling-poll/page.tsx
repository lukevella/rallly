"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Trans } from "react-i18next/TransWithoutContext";
import Bonus from "@/components/home/bonus";
import { FinalCta } from "@/components/home/final-cta";
import { MarketingHero } from "@/components/home/hero";
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
        title={t("freeSchedulingPollTitle", {
          ns: "home",
        })}
        description={t("freeSchedulingPollDescription", {
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
            i18nKey="freeSchedulingPollFinalCtaTitle"
            defaults="Ready to create your scheduling poll?"
          />
        }
        description={
          <Trans
            t={t}
            ns="home"
            i18nKey="freeSchedulingPollFinalCtaDescription"
            defaults="It takes seconds and your group can start voting right away."
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
    title: t("freeSchedulingPollMetaTitle", {
      ns: "home",
    }),
    description: t("freeSchedulingPollMetaDescription", {
      ns: "home",
    }),
  };
}
