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
      title={t("home:when2meetAlternativeMetaTitle", {
        defaultValue: "Best When2Meet Alternative: Rallly",
      })}
      description={t("home:when2meetAlternativeMetaDescription", {
        defaultValue:
          "Find a better way to schedule meetings with Rallly, the top free alternative to When2Meet. Easy to use and free.",
      })}
    >
      <MarketingHero
        title={t("home:when2meetAlternative", {
          defaultValue: "Still using When2Meet?",
        })}
        description={t("home:when2meetAlternativeDescription", {
          defaultValue:
            "Create professional, ad-free meetings polls for free with Rallly.",
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
