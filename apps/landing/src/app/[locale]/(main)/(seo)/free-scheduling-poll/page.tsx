"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Trans } from "react-i18next/TransWithoutContext";
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
  const { t } = await getTranslation(locale, ["home"]);
  return (
    <div className="divide-y">
      <Hero
        locale={locale}
        title={t("freeSchedulingPollTitle", {
          ns: "home",
        })}
        description={t("freeSchedulingPollDescription", {
          ns: "home",
        })}
      />
      <Stats locale={locale} />
      <Testimonial locale={locale} />
      <Mentions locale={locale} />
      <Cta
        locale={locale}
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
    title: t("freeSchedulingPollMetaTitle", {
      ns: "home",
    }),
    description: t("freeSchedulingPollMetaDescription", {
      ns: "home",
    }),
  };
}
