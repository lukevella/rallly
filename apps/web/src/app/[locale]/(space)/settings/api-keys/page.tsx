import type { Metadata } from "next";
import {
  PageSection,
  PageSectionContent,
  PageSectionGroup,
} from "@/app/components/page-layout";
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
import { ApiKeysList } from "./components/api-keys-list";

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
        <PageSectionGroup>
          <PageSection>
            <PageSectionContent>
              <ApiKeysList />
            </PageSectionContent>
          </PageSection>
        </PageSectionGroup>
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
