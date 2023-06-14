import Head from "next/head";
import { useTranslation } from "next-i18next";

import { getProfileLayout } from "@/components/layouts/profile-layout";
import { DateTimePreferences } from "@/components/settings/date-time-preferences";
import { LanguagePreference } from "@/components/settings/language-preference";
import { SettingsSection } from "@/components/settings/settings-section";
import { Trans } from "@/components/trans";

import { NextPageWithLayout } from "../../types";
import { getStaticTranslations } from "../../utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  return (
    <div className="divide-y">
      <Head>
        <title>{t("settings")}</title>
      </Head>
      <SettingsSection
        title={<Trans i18nKey="language" defaults="Language" />}
        description={
          <Trans
            i18nKey="languageDescription"
            defaults="Change your preferred language"
          />
        }
      >
        <LanguagePreference />
      </SettingsSection>
      <SettingsSection
        title={<Trans i18nKey="dateAndTime" defaults="Date & Time" />}
        description={
          <Trans
            i18nKey="dateAndTimeDescription"
            defaults="Change your preferred date and time settings"
          />
        }
      >
        <DateTimePreferences />
      </SettingsSection>
    </div>
  );
};

Page.getLayout = getProfileLayout;

export const getStaticProps = getStaticTranslations;

export default Page;
