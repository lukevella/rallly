import { Button } from "@rallly/ui/button";
import Head from "next/head";
import Script from "next/script";
import { useTranslation } from "next-i18next";

import { getProfileLayout } from "@/components/layouts/profile-layout";
import { SettingsSection } from "@/components/settings/settings-section";
import { Trans } from "@/components/trans";

import { NextPageWithLayout } from "../../types";
import { getStaticTranslations } from "../../utils/with-page-translations";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Paddle: any;
  }
}

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  return (
    <div className="divide-y">
      <Head>
        <title>{t("billing")}</title>
      </Head>
      <Script
        src="https://cdn.paddle.com/paddle/paddle.js"
        onLoad={() => {
          window.Paddle.Environment.set("sandbox");
          window.Paddle.Setup({ vendor: 12731 });
        }}
      />
      <SettingsSection
        title={<Trans i18nKey="plan" defaults="Plan" />}
        description={
          <Trans i18nKey="planDescription" defaults="Choose your plan" />
        }
      >
        <Button
          onClick={() =>
            window.Paddle.Checkout.open({
              allowQuantity: false,
              product: 53102,
            })
          }
        >
          Upgrade
        </Button>
      </SettingsSection>
    </div>
  );
};

Page.getLayout = getProfileLayout;

export const getStaticProps = getStaticTranslations;

export default Page;
