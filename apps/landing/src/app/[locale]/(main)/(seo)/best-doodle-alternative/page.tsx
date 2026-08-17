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
        title={t("doodleAlternative", {
          ns: "home",
        })}
        description={t("doodleAlternativeDescription", {
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
            i18nKey="doodleAlternativeFinalCtaTitle"
            defaults="Ready to make the switch?"
          />
        }
        description={
          <Trans
            t={t}
            ns="home"
            i18nKey="doodleAlternativeFinalCtaDescription"
            defaults="Create your first poll in seconds and see why so many people left Doodle behind."
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
    title: t("doodleAlternativeMetaTitle", {
      ns: "home",
    }),
    description: t("doodleAlternativeMetaDescription", {
      ns: "home",
    }),
  };
}
