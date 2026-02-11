import { Alert, AlertDescription } from "@rallly/ui/alert";
import { InfoIcon, ShieldCheckIcon } from "lucide-react";
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
import { Trans } from "@/i18n/client";
import { getUserHasPassword } from "@/features/user/queries";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { ChangePasswordForm } from "./components/change-password-form";
import { SetupPasswordForm } from "./components/setup-password-form";

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ setupPassword?: string }>;
}) {
  const { setupPassword } = await searchParams;
  const user = await requireUser();
  const isEmailLoginEnabled = isFeatureEnabled("emailLogin");
  const hasPassword = isEmailLoginEnabled
    ? await getUserHasPassword(user.id)
    : false;

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
        {isEmailLoginEnabled ? (
          <>
            {setupPassword ? (
              <Alert variant="success">
                <ShieldCheckIcon />
                <AlertDescription>
                  <p>
                    <Trans
                      i18nKey="passwordSetupSuccessful"
                      defaults="Password setup successful. You can now login with your email and password."
                    />
                  </p>
                </AlertDescription>
              </Alert>
            ) : null}
            <PageSectionGroup>
              {hasPassword ? (
                <PageSection variant="card">
                  <PageSectionHeader>
                    <PageSectionTitle>
                      <Trans
                        i18nKey="changePassword"
                        defaults="Change Password"
                      />
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
                      <Trans
                        i18nKey="resetPasswordTitle"
                        defaults="Reset Password"
                      />
                    </PageSectionTitle>
                    <PageSectionDescription className="max-w-lg">
                      <Trans
                        i18nKey="setupPasswordDescription"
                        defaults="Your account doesn't have a password yet. Click the button below to send a secure link to your email to set a password."
                      />
                    </PageSectionDescription>
                  </PageSectionHeader>
                  <PageSectionContent>
                    <SetupPasswordForm email={user.email} />
                  </PageSectionContent>
                </PageSection>
              )}
            </PageSectionGroup>
          </>
        ) : (
          <Alert>
            <InfoIcon />
            <AlertDescription>
              <Trans
                i18nKey="ssoAuthenticationOnly"
                defaults="Authentication is managed through Single Sign-On (SSO). Password management is not available."
              />
            </AlertDescription>
          </Alert>
        )}
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
