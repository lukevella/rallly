import { FieldGroup } from "@rallly/ui/field";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
import { DeleteAccountSetting } from "./components/delete-account-setting";
import { EmailAddressSetting } from "./components/email-address-setting";
import { ProfileSettings } from "./components/profile-settings";

export default async function Page() {
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
            defaults="Change your profile settings"
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
                <Trans i18nKey="profileAccount" defaults="Account" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="profileEmailAddressDescription"
                  defaults="Your email address is used to log in to your account"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <FieldGroup variant="divided">
                <EmailAddressSetting email={user.email} />
              </FieldGroup>
            </PageSectionContent>
          </PageSection>

          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="dangerZone" defaults="Danger zone" />
              </PageSectionTitle>
            </PageSectionHeader>
            <PageSectionContent>
              <FieldGroup>
                <DeleteAccountSetting />
              </FieldGroup>
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
