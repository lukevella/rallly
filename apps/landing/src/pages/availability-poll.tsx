import { useTranslation } from "next-i18next";

import { MarketingHero } from "@/components/home/hero";
import { getPageLayout } from "@/components/layouts/page-layout";
import { Marketing } from "@/components/marketing";
import { Trans } from "@/components/trans";
import { NextPageWithLayout } from "@/types";
import { getStaticTranslations } from "@/utils/page-translations";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation(["home"]);
  return (
    <Marketing
      title={t("home:availabilityPollMetaTitle", {
        defaultValue: "Availability Poll | Streamline Scheduling with Rallly",
      })}
      description={t("home:availabilityPollMetaDescription", {
        defaultValue:
          "Schedule meetings and events seamlessly with Rallly's Availability Poll. Ensure everyone's availability is considered for a smooth and efficient planning experience.",
      })}
    >
      <MarketingHero
        title={t("home:availabilityPollTitle", {
          defaultValue: "Availability Polls",
        })}
        description={t("home:availabilityPollDescription", {
          defaultValue:
            "Tired of struggling to find a meeting time that works for everyone? Streamline your scheduling with an availability poll - a powerful tool designed to simplify and optimize your event and meeting planning.",
        })}
        callToAction={
          <Trans
            i18nKey="home:availabilityPollCta"
            defaults="Create an Availability Poll"
          />
        }
      />
    </Marketing>
  );
};

Page.getLayout = getPageLayout;

export default Page;

export const getStaticProps = getStaticTranslations(["home"]);
