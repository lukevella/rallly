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
      title={t("home:freeSchedulingPollMetaTitle", {
        defaultValue: "Free Scheduling Poll | Rallly",
      })}
      description={t("home:freeSchedulingPollMetaDescription", {
        defaultValue:
          "Create a free scheduling poll in seconds. Ideal for organizing meetings, events, conferences, sports teams and more.",
      })}
    >
      <MarketingHero
        title={t("home:freeSchedulingPollTitle", {
          defaultValue: "Looking for a free scheduling poll?",
        })}
        description={t("home:freeSchedulingPollDescription", {
          defaultValue:
            "Rallly let's you create beautiful and easy to use scheduling polls so you can find the best time for your next event.",
        })}
        callToAction={
          <Trans
            i18nKey="home:createASchedulingPoll"
            defaults="Create a Scheduling Poll"
          />
        }
      />
    </Marketing>
  );
};

Page.getLayout = getPageLayout;

export default Page;

export const getStaticProps = getStaticTranslations(["home"]);
