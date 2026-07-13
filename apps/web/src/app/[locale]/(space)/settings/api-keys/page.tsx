import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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
import { getApiKeysPageState, getSpaceApiKeys } from "@/features/api-keys/data";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { getPathname } from "@/lib/pathname";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";
import { ApiAccessUpgrade } from "./components/api-access-upgrade";
import { ApiKeysList } from "./components/api-keys-list";
import { ApiUsageLimits } from "./components/api-usage-limits";
import { CreateApiKeyButton } from "./components/create-api-key-button";

export default async function ApiKeysSettingsPage() {
  const pageState = await getApiKeysPageState();

  if (pageState.state === "unauthorized") {
    redirect(
      buildSafeRedirectUrl({
        destination: "/login",
        returnUrl: await getPathname(),
      }),
    );
  }

  if (pageState.state === "unavailable") {
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
        {pageState.state === "enabled" ? (
          <SettingsPageAction>
            <CreateApiKeyButton />
          </SettingsPageAction>
        ) : null}
      </SettingsPageHeader>
      <SettingsPageContent>
        {pageState.state === "upgrade_required" ? (
          <ApiAccessUpgrade />
        ) : (
          <ApiKeysContent />
        )}
      </SettingsPageContent>
    </SettingsPage>
  );
}

async function ApiKeysContent() {
  const result = await getSpaceApiKeys();

  if (!result.ok) {
    notFound();
  }

  return (
    <PageSectionGroup>
      <ApiUsageLimits />
      <PageSection>
        <PageSectionContent>
          <ApiKeysList apiKeys={result.apiKeys} />
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
