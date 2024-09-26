import { Trans } from "react-i18next/TransWithoutContext";

import Bonus from "@/components/home/bonus";
import { MarketingHero } from "@/components/home/hero";
import { BigTestimonial, Marketing, MentionedBy } from "@/components/marketing";
import { getTranslation } from "@/i18n/server";

export default async function Page({ params }: { params: { locale: string } }) {
  const { t } = await getTranslation(params.locale, ["home"]);
  return (
    <Marketing>
      <MarketingHero
        title={t("meetingPoll", {
          defaultValue: "Create professional meetings polls with Rallly",
          ns: "home",
        })}
        description={t("meetingPollDescription", {
          defaultValue:
            "Meeting polls are a great way to get people's availability. Rallly lets you create beautiful meeting polls with ease.",
          ns: "home",
        })}
        callToAction={<Trans t={t} ns="home" i18nKey="createAPoll" />}
      />
      <Bonus t={t} />
      <BigTestimonial />
      <MentionedBy />
    </Marketing>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale, "home");
  return {
    title: t("meetingPollMetaTitle", {
      ns: "home",
      defaultValue: "Meeting Poll",
    }),
    description: t("meetingPollMetaDescription", {
      ns: "home",
      defaultValue:
        "Easily schedule meetings with our poll feature, ensuring everyone's availability.",
    }),
  };
}
