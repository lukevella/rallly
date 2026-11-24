import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Button } from "@rallly/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@rallly/ui/field";
import { InfoIcon, KeyRoundIcon } from "lucide-react";
import type { Metadata } from "next";
import React from "react";
import type { Params } from "@/app/[locale]/types";
import {
  PageSection,
  PageSectionContent,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import { SettingIcon } from "@/components/setting-icon";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { getUserHasPassword } from "@/features/user/data";
import { loadUser } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { ChangePasswordDialog } from "./components/change-password-dialog";
import { SetupPasswordDialog } from "./components/setup-password-dialog";
import { SignInAccounts } from "./components/sign-in-accounts";

export default async function SecurityPage() {
  const user = await loadUser();

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
          <PageSectionGroup>
            <PageSection variant="card">
              <PageSectionHeader>
                <PageSectionTitle>
                  <Trans i18nKey="password" defaults="Password" />
                </PageSectionTitle>
              </PageSectionHeader>
              <PageSectionContent>
                <FieldGroup variant="divided">
                  <Field orientation="responsive">
                    <SettingIcon>
                      <KeyRoundIcon />
                    </SettingIcon>
                    <FieldContent>
                      <FieldTitle>
                        {hasPassword ? (
                          <Trans
                            i18nKey="changePassword"
                            defaults="Change password"
                          />
                        ) : (
                          <Trans
                            i18nKey="noPasswordSet"
                            defaults="No password set"
                          />
                        )}
                      </FieldTitle>
                      <FieldDescription>
                        {hasPassword ? (
                          <Trans
                            i18nKey="passwordSetHint"
                            defaults="Your account has a password set."
                          />
                        ) : (
                          <Trans
                            i18nKey="noPasswordSetHint"
                            defaults="Your account doesn't have a password yet."
                          />
                        )}
                      </FieldDescription>
                    </FieldContent>
                    {hasPassword ? (
                      <ChangePasswordDialog
                        trigger={
                          <Button>
                            <Trans
                              i18nKey="changePassword"
                              defaults="Change password"
                            />
                          </Button>
                        }
                      />
                    ) : (
                      <SetupPasswordDialog
                        trigger={
                          <Button>
                            <Trans
                              i18nKey="setPassword"
                              defaults="Set password"
                            />
                          </Button>
                        }
                      />
                    )}
                  </Field>
                </FieldGroup>
              </PageSectionContent>
            </PageSection>
            <React.Suspense fallback={null}>
              <SignInAccounts />
            </React.Suspense>
          </PageSectionGroup>
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
