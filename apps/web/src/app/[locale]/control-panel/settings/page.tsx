import { PageIcon } from "@/app/components/page-icons";
import {
  FullWidthLayout,
  FullWidthLayoutContent,
  FullWidthLayoutHeader,
  FullWidthLayoutTitle,
} from "@/components/full-width-layout";
import {
  SettingsGroup,
  SettingsGroupContent,
  SettingsGroupDescription,
  SettingsGroupHeader,
  SettingsGroupTitle,
} from "@/components/settings-group";
import { Trans } from "@/components/trans";
import { getInstanceSettings } from "@/features/instance-settings/queries";
import { SettingsIcon } from "lucide-react";
import { DisableUserRegistration } from "./disable-user-registration";

async function loadData() {
  const instanceSettings = await getInstanceSettings();

  return {
    instanceSettings,
  };
}

export default async function SettingsPage() {
  const { instanceSettings } = await loadData();

  return (
    <FullWidthLayout>
      <FullWidthLayoutHeader>
        <FullWidthLayoutTitle
          icon={
            <PageIcon size="sm" color="darkGray">
              <SettingsIcon />
            </PageIcon>
          }
        >
          <Trans i18nKey="settings" defaults="Settings" />
        </FullWidthLayoutTitle>
      </FullWidthLayoutHeader>
      <FullWidthLayoutContent>
        <SettingsGroup>
          <SettingsGroupHeader>
            <SettingsGroupTitle>
              <Trans
                i18nKey="authenticationAndSecurity"
                defaults="Authentication & Security"
              />
            </SettingsGroupTitle>
            <SettingsGroupDescription>
              <Trans
                i18nKey="authenticationAndSecurityDescription"
                defaults="Manage authentication and security settings"
              />
            </SettingsGroupDescription>
          </SettingsGroupHeader>
          <SettingsGroupContent>
            <DisableUserRegistration
              defaultValue={instanceSettings?.disableUserRegistration}
            />
          </SettingsGroupContent>
        </SettingsGroup>
      </FullWidthLayoutContent>
    </FullWidthLayout>
  );
}
