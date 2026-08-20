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
import { getInstanceSettings } from "@/features/instance-settings/data";
import { loadFooterLinks } from "@/features/instance-settings/loaders";
import { Trans } from "@/i18n/client";
import { FooterLinksField } from "./footer-links-field";
import { InstanceSettingsForm } from "./instance-settings-form";

async function loadData() {
  const [instanceSettings, footerLinks] = await Promise.all([
    getInstanceSettings(),
    loadFooterLinks(),
  ]);

  return {
    instanceSettings,
    footerLinks,
  };
}

export default async function InstanceSettingsPage() {
  const { instanceSettings, footerLinks } = await loadData();

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
          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="footerLinks" defaults="Footer links" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="footerLinksDescription"
                  defaults="Links shown on the login and invite pages, for legal notices such as an imprint or privacy policy"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <FooterLinksField defaultValue={footerLinks} />
            </PageSectionContent>
          </PageSection>
        </PageSectionGroup>
      </SettingsPageContent>
    </SettingsPage>
  );
}
