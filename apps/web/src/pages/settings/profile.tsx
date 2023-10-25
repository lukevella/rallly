import Head from "next/head";
import { useTranslation } from "next-i18next";

import { getProfileLayout } from "@/components/layouts/profile-layout";
import { ProfileSettings } from "@/components/settings/profile-settings";
import {
  Settings,
  SettingsHeader,
  SettingsSection,
} from "@/components/settings/settings";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";

import { NextPageWithLayout } from "../../types";
import { getStaticTranslations } from "../../utils/with-page-translations";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const { user } = useUser();

  if (user.isGuest) {
    return null;
  }
  return (
    <Settings>
      <Head>
        <title>{t("profile")}</title>
      </Head>
      <SettingsHeader>
        <Trans i18nKey="profile" />
      </SettingsHeader>
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
      {/* <SettingsSection
        title={<Trans defaults="Email" i18nKey="settings_profile_email" />}
        description={
          <Trans
            i18nKey="settings_profile_emailDescription"
            defaults="Change your email address"
          />
        }
      >
        <ChangeEmailForm />
      </SettingsSection> */}
      {/* <SettingsSection
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
        <Button htmlType="submit" variant="destructive">
          <Trans i18nKey="deleteMyAccount" defaults="Yes, delete my account" />
        </Button>
      </SettingsSection> */}
    </Settings>
  );
};

Page.getLayout = getProfileLayout;
Page.isAuthRequired = true;

export const getStaticProps = getStaticTranslations;

export default Page;
