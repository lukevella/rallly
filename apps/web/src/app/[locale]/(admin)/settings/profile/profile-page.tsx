"use client";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { Label } from "@rallly/ui/label";
import { InfoIcon, LogOutIcon, UserXIcon } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "next-i18next";

import { LogoutButton } from "@/app/components/logout-button";
import { ProfileSettings } from "@/components/settings/profile-settings";
import {
  Settings,
  SettingsContent,
  SettingsSection,
} from "@/components/settings/settings";
import { TextInput } from "@/components/text-input";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";

export const ProfilePage = () => {
  const { t } = useTranslation();
  const { user } = useUser();

  return (
    <Settings>
      <Head>
        <title>{t("profile")}</title>
      </Head>
      {user.isGuest ? (
        <SettingsContent>
          <SettingsSection
            title={<Trans i18nKey="profile" />}
            description={<Trans i18nKey="profileDescription" />}
          >
            <Label className="mb-2.5">
              <Trans i18nKey="userId" defaults="User ID" />
            </Label>
            <TextInput
              className="w-full"
              value={user.id.substring(0, 10)}
              readOnly
              disabled
            />
            <Alert className="mt-4" icon={InfoIcon}>
              <AlertTitle>
                <Trans i18nKey="aboutGuest" defaults="Guest User" />
              </AlertTitle>
              <AlertDescription>
                <Trans
                  i18nKey="aboutGuestDescription"
                  defaults="Profile settings are not available for guest users. <0>Sign in</0> to your existing account or <1>create a new account</1> to customize your profile."
                  components={[
                    <Link className="text-link" key={0} href="/login" />,
                    <Link className="text-link" key={1} href="/register" />,
                  ]}
                />
              </AlertDescription>
            </Alert>
            <LogoutButton className="mt-6" variant="destructive">
              <UserXIcon className="h-4 w-4" />
              <Trans i18nKey="forgetMe" />
            </LogoutButton>
          </SettingsSection>
        </SettingsContent>
      ) : (
        <SettingsContent>
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
          <hr />

          <SettingsSection
            title={<Trans i18nKey="logout" />}
            description={
              <Trans
                i18nKey="logoutDescription"
                defaults="Sign out of your existing session"
              />
            }
          >
            <LogoutButton>
              <LogOutIcon className="h-4 w-4" />
              <Trans i18nKey="logout" defaults="Logout" />
            </LogoutButton>
          </SettingsSection>
        </SettingsContent>
      )}
    </Settings>
  );
};
