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
      title={t("home:findATimeMetaTitle", {
        defaultValue: "Find a Time to Meet | Rallly",
      })}
      description={t("home:findATimeMetaDescription", {
        defaultValue: "Create a meeting poll in seconds, no login required.",
      })}
    >
      <MarketingHero
        title={t("home:findATimeTitle", {
          defaultValue: "Find a Time to Meet",
        })}
        description={t("home:findATimeDescription", {
          defaultValue:
            "Create a meeting poll and let your participants vote on the best time to meet.",
        })}
        callToAction={
          <Trans i18nKey="home:createAPoll" defaults="Create a Meeting Poll" />
        }
      />
    </Marketing>
  );
};

Page.getLayout = getPageLayout;

export default Page;

export const getStaticProps = getStaticTranslations(["home"]);
