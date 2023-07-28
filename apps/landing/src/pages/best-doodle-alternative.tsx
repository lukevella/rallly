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
      title={t("home:doodleAlternativeMetaTitle", {
        defaultValue: "Best Free Doodle Alternative | Rallly",
      })}
      description={t("home:doodleAlternativeMetaDescription", {
        defaultValue:
          "Looking for a Doodle alternative? Try Rallly! It's free, easy to use, and doesn't require an account.",
      })}
    >
      <MarketingHero
        title={t("home:doodleAlternative", {
          defaultValue: "The Best Free Doodle Alternative",
        })}
        description={t("home:doodleAlternativeDescription", {
          defaultValue:
            "Rallly is the Doodle alternative that everyone is looking for. Thousands of users have already made the switch and are now enjoying professional ad-free meeting polls in an intuitive and easy-to-use interface.",
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
