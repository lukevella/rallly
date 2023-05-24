import { withAuth, withSessionSsr } from "@rallly/backend/next";
import Head from "next/head";
import { useTranslation } from "next-i18next";

import { Button } from "@/components/button";
import { getProfileLayout } from "@/components/layouts/profile-layout";
import { ChangeEmailForm } from "@/components/settings/change-email-form";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { SettingsSection } from "@/components/settings/settings-section";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";

import { NextPageWithLayout } from "../../types";
import { withPageTranslations } from "../../utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const { user } = useUser();

  if (user.isGuest) {
    return null;
  }
  return (
    <div className="divide-y">
      <Head>
        <title>{t("settings")}</title>
      </Head>
      <SettingsSection
        title={<Trans i18nKey="profile" defaults="Profile" />}
        description={
          <Trans
            i18nKey="profileDescription"
            defaults="Set your public profile information"
          />
        }
      >
        <ProfileSettings />
      </SettingsSection>
      <SettingsSection
        title={<Trans defaults="Email" i18nKey="settings_profile_email" />}
        description={
          <Trans
            i18nKey="settings_profile_emailDescription"
            defaults="Change your email address"
          />
        }
      >
        <ChangeEmailForm />
      </SettingsSection>
      <SettingsSection
        title={<Trans i18nKey="deleteAccount" defaults="Delete Account" />}
        description={
          <Trans
            i18nKey="deleteAccountDescription"
            defaults="Delete your account here.
            This action is not reversible. All information related to this
            account will be deleted permanently."
          />
        }
      >
        <Button htmlType="submit" type="danger">
          <Trans i18nKey="deleteMyAccount" defaults="Yes, delete my account" />
        </Button>
      </SettingsSection>
    </div>
  );
};

Page.getLayout = getProfileLayout;

export const getServerSideProps = withSessionSsr([
  withAuth,
  withPageTranslations(),
]);

export default Page;
