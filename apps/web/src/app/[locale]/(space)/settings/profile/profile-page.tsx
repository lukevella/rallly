"use client";

import { Button } from "@rallly/ui/button";
import { DialogTrigger } from "@rallly/ui/dialog";

import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageHeader,
} from "@/components/settings-layout";
import { Trans } from "@/i18n/client";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { ProfileEmailAddress } from "./profile-email-address";
import { ProfileSettings } from "./profile-settings";

export function ProfilePage() {
  return (
    <SettingsPage>
      <SettingsPageHeader
        title={<Trans i18nKey="profile" defaults="Profile" />}
        description={
          <Trans
            i18nKey="profileDescription"
            defaults="Set your public profile information"
          />
        }
      />
      <SettingsPageContent>
        <PageSectionGroup>
          <PageSection variant="card">
            <PageSectionContent>
              <ProfileSettings />
            </PageSectionContent>
          </PageSection>

          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="profileEmailAddress" defaults="Email Address" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="profileEmailAddressDescription"
                  defaults="Your email address is used to log in to your account"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <ProfileEmailAddress />
            </PageSectionContent>
          </PageSection>

          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="dangerZone" defaults="Danger Zone" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="dangerZoneAccount"
                  defaults="Delete your account permanently. This action cannot be undone."
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <DeleteAccountDialog>
                <DialogTrigger render={<Button className="text-destructive" />}>
                  <Trans i18nKey="deleteAccount" defaults="Delete Account" />
                </DialogTrigger>
              </DeleteAccountDialog>
            </PageSectionContent>
          </PageSection>
        </PageSectionGroup>
      </SettingsPageContent>
    </SettingsPage>
  );
}
