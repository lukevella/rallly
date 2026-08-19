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
          title={t("doodleAlternative", {
            ns: "home",
          })}
          description={t("doodleAlternativeDescription", {
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
                i18nKey="faqDoodleDifference"
                defaults="How is Rallly different from Doodle?"
              />
            }
            answer={
              <Trans
                t={t}
                ns="home"
                i18nKey="faqDoodleDifferenceAnswer"
                defaults="Rallly gives you professional, ad-free meeting polls in a clean and easy to use interface. Participants can vote without creating an account, and if you want full control of your data you can even host Rallly on your own server."
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
                values={{ toolName: "Doodle" }}
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
