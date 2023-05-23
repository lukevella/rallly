import {
  withAuth,
  withAuthIfRequired,
  withSessionSsr,
} from "@rallly/backend/next";

import { getProfileLayout } from "@/components/layouts/profile-layout";
import DateTimePreferences from "@/components/settings/date-time-preferences";
import { Trans } from "@/components/trans";

import { NextPageWithLayout } from "../../types";
import { withPageTranslations } from "../../utils/with-page-translations";
import { Button } from "@/components/button";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { useUser } from "@/components/user-provider";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { SettingsSection } from "@/components/settings/settings-section";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  return (
    <div className="divide-y">
      <Head>
        <title>{t("settings")}</title>
      </Head>
      <SettingsSection
        title={<Trans i18nKey="dateAndTime" defaults="Date & Time" />}
        description={
          <Trans
            i18nKey="profileDescription"
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

export const getServerSideProps = withSessionSsr([
  withAuthIfRequired,
  withPageTranslations(),
]);

export default Page;
