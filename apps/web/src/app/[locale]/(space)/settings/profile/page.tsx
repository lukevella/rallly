import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import type { Params } from "@/app/[locale]/types";
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
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { getCurrentUser } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { getPathname } from "@/lib/pathname";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";
import {
  AccountDeletionSummary,
  AccountDeletionSummarySkeleton,
} from "./components/account-deletion-summary";
import { DeleteAccountButton } from "./components/delete-account-button";
import { PendingDeletionNotice } from "./components/pending-deletion-notice";
import { ProfileEmailAddress } from "./components/profile-email-address";
import { ProfileSettings } from "./components/profile-settings";

export default async function Page() {
  // Read from the database — the pending deletion notice depends on
  // deletedAt, which the session snapshot doesn't carry.
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      buildSafeRedirectUrl({
        destination: "/login",
        returnUrl: await getPathname(),
      }),
    );
  }

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="profile" defaults="Profile" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="profileDescription"
            defaults="Set your public profile information"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        <PageSectionGroup>
          <PageSection variant="card">
            <PageSectionContent>
              <ProfileSettings name={user.name} image={user.image} />
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
              <ProfileEmailAddress email={user.email} />
            </PageSectionContent>
          </PageSection>

          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="dangerZone" defaults="Danger Zone" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="dangerZoneAccountDeletion"
                  defaults="Delete your account and all data associated with it"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              {user.deletedAt ? (
                <PendingDeletionNotice deletedAt={user.deletedAt} />
              ) : (
                <DeleteAccountButton
                  summary={
                    <Suspense fallback={<AccountDeletionSummarySkeleton />}>
                      <AccountDeletionSummary />
                    </Suspense>
                  }
                />
              )}
            </PageSectionContent>
          </PageSection>
        </PageSectionGroup>
      </SettingsPageContent>
    </SettingsPage>
  );
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("profile"),
  };
}
