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
      title={t("home:metaTitle", {
        defaultValue: "Rallly - Schedule Group Meetings",
      })}
      description={t("home:metaDescription", {
        defaultValue:
          "Create polls and vote to find the best day or time. A free alternative to Doodle.",
      })}
    >
      <MarketingHero
        title={t("home:headline")}
        description={t("home:subheading", {
          defaultValue: "Streamline your scheduling process and save time",
        })}
        callToAction={<Trans i18nKey="getStarted" defaults="Get started" />}
      />
    </Marketing>
  );
};

Page.getLayout = getPageLayout;

export default Page;

export const getStaticProps = getStaticTranslations(["home"]);
