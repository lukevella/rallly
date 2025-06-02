import { PageIcon } from "@/app/components/page-icons";
import {
  FullWidthLayout,
  FullWidthLayoutContent,
  FullWidthLayoutHeader,
  FullWidthLayoutTitle,
} from "@/components/full-width-layout";
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
        <div className="flex flex-col lg:flex-row p-6 gap-6 rounded-lg border">
          <div className="lg:w-1/2">
            <h2 className="text-base font-semibold">
              <Trans
                i18nKey="authenticationAndSecurity"
                defaults="Authentication & Security"
              />
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              <Trans
                i18nKey="authenticationAndSecurityDescription"
                defaults="Manage authentication and security settings"
              />
            </p>
          </div>
          <div className="flex-1">
            <DisableUserRegistration
              defaultValue={instanceSettings?.disableUserRegistration}
            />
          </div>
        </div>
      </FullWidthLayoutContent>
    </FullWidthLayout>
  );
}
