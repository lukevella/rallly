import type { Metadata } from "next";

import type { Params } from "@/app/[locale]/types";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/app/components/settings-layout";
import { requireUser } from "@/auth/data";
import { Trans } from "@/components/trans";
import { getUserHasPassword } from "@/features/user/queries";
import { getTranslation } from "@/i18n/server";
import { ChangePasswordForm } from "./components/change-password-form";
import { SetupPasswordForm } from "./components/setup-password-form";

export default async function SecurityPage() {
  const user = await requireUser();
  const hasPassword = await getUserHasPassword(user.id);

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="security" defaults="Security" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="securityDescription"
            defaults="Manage your account security and password settings"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        <PageSectionGroup>
          {hasPassword ? (
            <PageSection variant="card">
              <PageSectionHeader>
                <PageSectionTitle>
                  <Trans i18nKey="changePassword" defaults="Change Password" />
                </PageSectionTitle>
                <PageSectionDescription>
                  <Trans
                    i18nKey="changePasswordDescription"
                    defaults="Update your password to keep your account secure"
                  />
                </PageSectionDescription>
              </PageSectionHeader>
              <PageSectionContent>
                <ChangePasswordForm />
              </PageSectionContent>
            </PageSection>
          ) : (
            <PageSection variant="card">
              <PageSectionHeader>
                <PageSectionTitle>
                  <Trans i18nKey="changePassword" defaults="Set Password" />
                </PageSectionTitle>
                <PageSectionDescription>
                  <Trans
                    i18nKey="forgotPasswordDescription"
                    defaults="Set a password to enable password-based login for your account"
                  />
                </PageSectionDescription>
              </PageSectionHeader>
              <PageSectionContent>
                <SetupPasswordForm />
              </PageSectionContent>
            </PageSection>
          )}
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
    title: t("security", { defaultValue: "Security" }),
  };
}
