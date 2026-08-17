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
        title={t("when2meetAlternative", {
          ns: "home",
        })}
        description={t("when2meetAlternativeDescription", {
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
    title: t("when2meetAlternativeMetaTitle", {
      ns: "home",
    }),
    description: t("when2meetAlternativeMetaDescription", {
      ns: "home",
    }),
  };
}
