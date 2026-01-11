import type { Metadata } from "next";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/app/components/settings-layout";
import { requireSpace, requireUser } from "@/auth/data";
import { Trans } from "@/components/trans";
import { getTranslation } from "@/i18n/server";

export default async function ApiKeysSettingsPage() {
  const [_space, _user] = await Promise.all([requireSpace(), requireUser()]);

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="apiKeys" defaults="API Keys" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="apiKeysDescription"
            defaults="Manage API keys for programmatic access to your space"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        {/* TODO: Add API keys list and creation form */}
      </SettingsPageContent>
    </SettingsPage>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("apiKeysSettings", {
      defaultValue: "API Keys Settings",
    }),
    description: t("apiKeysSettingsDescription", {
      defaultValue:
        "Create and manage API keys for programmatic access to your space.",
    }),
  };
}
