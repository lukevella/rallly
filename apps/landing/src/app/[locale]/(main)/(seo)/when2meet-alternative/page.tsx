"use cache";

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { Trans } from "react-i18next/TransWithoutContext";
import { Cta } from "@/components/home/cta";
import { Faq, FaqItem } from "@/components/home/faq";
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
      <div>
        <Hero
          locale={locale}
          title={t("when2meetAlternative", {
            ns: "home",
          })}
          description={t("when2meetAlternativeDescription", {
            ns: "home",
          })}
        />
        <Stats locale={locale} className="pt-4 sm:pt-0" />
      </div>
      <Testimonial locale={locale} />
      <Mentions locale={locale} />
      <div>
        <Faq locale={locale}>
          <FaqItem
            question={
              <Trans
                t={t}
                ns="home"
                i18nKey="faqWhen2meetDifference"
                defaults="How is Rallly different from When2Meet?"
              />
            }
            answer={
              <Trans
                t={t}
                ns="home"
                i18nKey="faqWhen2meetDifferenceAnswer"
                defaults="Rallly does everything you use When2Meet for, with a cleaner interface that works great on mobile. You get notified when participants respond, and you can manage all your polls in one place."
              />
            }
          />
          <FaqItem
            question={
              <Trans
                t={t}
                ns="home"
                i18nKey="faqImport"
                defaults="Can I move my {toolName} polls to Rallly?"
                values={{ toolName: "When2Meet" }}
              />
            }
            answer={
              <Trans
                t={t}
                ns="home"
                i18nKey="faqImportAnswer"
                defaults="There is no automatic import, but a poll only takes a minute to set up, so most people simply recreate their active polls in Rallly."
              />
            }
          />
        </Faq>
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
