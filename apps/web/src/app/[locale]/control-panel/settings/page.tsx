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
import { requireAdmin } from "@/auth/data";
import { Trans } from "@/i18n/client";
import { getInstanceSettings } from "@/features/instance-settings/queries";
import { InstanceSettingsForm } from "./instance-settings-form";

async function loadData() {
  const [instanceSettings] = await Promise.all([
    getInstanceSettings(),
    requireAdmin(),
  ]);

  return {
    instanceSettings,
  };
}

export default async function InstanceSettingsPage() {
  const { instanceSettings } = await loadData();

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="settings" defaults="Settings" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="instanceSettingsDescription"
            defaults="Configure your instance settings"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        <PageSectionGroup>
          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans
                  i18nKey="authenticationAndSecurity"
                  defaults="Authentication & Security"
                />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="authenticationAndSecurityDescription"
                  defaults="Manage authentication and security settings"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <InstanceSettingsForm defaultValue={instanceSettings} />
            </PageSectionContent>
          </PageSection>
        </PageSectionGroup>
      </SettingsPageContent>
    </SettingsPage>
  );
}
