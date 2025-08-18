import type { Metadata } from "next";
import { Trans } from "react-i18next/TransWithoutContext";
import Bonus from "@/components/home/bonus";
import { MarketingHero } from "@/components/home/hero";
import { BigTestimonial, Marketing, MentionedBy } from "@/components/marketing";
import { getTranslation } from "@/i18n/server";

export default async function Page() {
  const { t } = await getTranslation(["home"]);
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
      <Bonus />
      <BigTestimonial />
      <MentionedBy />
    </Marketing>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation("home");
  return {
    title: t("freeSchedulingPollMetaTitle", {
      ns: "home",
    }),
    description: t("freeSchedulingPollMetaDescription", {
      ns: "home",
    }),
  };
}
