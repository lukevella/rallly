import { Trans } from "react-i18next/TransWithoutContext";

import Bonus from "@/components/home/bonus";
import { MarketingHero } from "@/components/home/hero";
import { BigTestimonial, Marketing, MentionedBy } from "@/components/marketing";
import { getTranslation } from "@/i18n/server";

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const { t } = await getTranslation(params.locale, "home");
  return (
    <Marketing>
      <MarketingHero
        title={t("availabilityPollTitle", {
          ns: "home",
          defaultValue: "Availability Polls",
        })}
        description={t("availabilityPollDescription", {
          ns: "home",
          defaultValue:
            "Tired of struggling to find a meeting time that works for everyone? Streamline your scheduling with an availability poll - a powerful tool designed to simplify and optimize your event and meeting planning.",
        })}
        callToAction={
          <Trans
            t={t}
            ns="home"
            i18nKey="availabilityPollCta"
            defaults="Create an Availability Poll"
          />
        }
      />
      <Bonus t={t} />
      <BigTestimonial />
      <MentionedBy />
    </Marketing>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const { t } = await getTranslation(params.locale, "home");
  return {
    title: t("availabilityPollMetaTitle", {
      ns: "home",
    }),
    description: t("availabilityPollMetaDescription", {
      ns: "home",
    }),
  };
}
