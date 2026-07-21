import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PageSection,
  PageSectionContent,
  PageSectionGroup,
} from "@/components/page-layout";
import {
  SettingsPage,
  SettingsPageAction,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { getSpaceApiKeys, isApiAccessEnabled } from "@/features/api-keys/data";
import { getActiveSpace } from "@/features/space/loaders";
import { requireUser } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { ApiAccessUpgrade } from "./components/api-access-upgrade";
import { ApiKeysList } from "./components/api-keys-list";
import { ApiUsageLimits } from "./components/api-usage-limits";
import { CreateApiKeyButton } from "./components/create-api-key-button";

export default async function ApiKeysSettingsPage() {
  const user = await requireUser();

  const space = await getActiveSpace();
  const enabled = await isApiAccessEnabled(user, space);

  // "Needs to upgrade" (hobby tier) gets its own screen; every other reason
  // access is blocked (feature flag off, not the owner) is a 404.
  if (!enabled && space.tier !== "hobby") {
    notFound();
  }

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
        {enabled ? (
          <SettingsPageAction>
            <CreateApiKeyButton />
          </SettingsPageAction>
        ) : null}
      </SettingsPageHeader>
      <SettingsPageContent>
        {enabled ? <ApiKeysContent /> : <ApiAccessUpgrade />}
      </SettingsPageContent>
    </SettingsPage>
  );
}

async function ApiKeysContent() {
  const space = await getActiveSpace();
  const apiKeys = await getSpaceApiKeys({ spaceId: space.id });

  return (
    <PageSectionGroup>
      <ApiUsageLimits />
      <PageSection>
        <PageSectionContent>
          <ApiKeysList apiKeys={apiKeys} />
        </PageSectionContent>
      </PageSection>
    </PageSectionGroup>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("apiKeys", {
      defaultValue: "API Keys",
    }),
    description: t("apiKeysSettingsDescription", {
      defaultValue:
        "Create and manage API keys for programmatic access to your space.",
    }),
  };
}
