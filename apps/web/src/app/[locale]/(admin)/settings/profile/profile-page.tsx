"use client";
import { Button } from "@rallly/ui/button";
import { DialogTrigger } from "@rallly/ui/dialog";
import { TrashIcon } from "lucide-react";

import { DeleteAccountDialog } from "@/app/[locale]/(admin)/settings/profile/delete-account-dialog";
import { ProfileSettings } from "@/app/[locale]/(admin)/settings/profile/profile-settings";
import {
  SettingsContent,
  SettingsSection,
} from "@/app/[locale]/(admin)/settings/components/settings-layout";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";

import { ProfileEmailAddress } from "./profile-email-address";

export const ProfilePage = () => {
  const { user } = useUser();

  return (
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
      <SettingsSection
        title={<Trans i18nKey="profileEmailAddress" defaults="Email Address" />}
        description={
          <Trans
            i18nKey="profileEmailAddressDescription"
            defaults="Your email address is used to log in to your account"
          />
        }
      >
        <ProfileEmailAddress />
      </SettingsSection>
      <hr />

      {user.email ? (
        <>
          <hr />
          <SettingsSection
            title={<Trans i18nKey="dangerZone" defaults="Danger Zone" />}
            description={
              <Trans
                i18nKey="dangerZoneAccount"
                defaults="Delete your account permanently. This action cannot be undone."
              />
            }
          >
            <DeleteAccountDialog email={user.email}>
              <DialogTrigger asChild>
                <Button className="text-destructive">
                  <TrashIcon className="size-4" />
                  <Trans i18nKey="deleteAccount" defaults="Delete Account" />
                </Button>
              </DialogTrigger>
            </DeleteAccountDialog>
          </SettingsSection>
        </>
      ) : null}
    </SettingsContent>
  );
};
