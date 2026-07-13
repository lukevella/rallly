import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  PageSection,
  PageSectionContent,
  PageSectionGroup,
} from "@/components/page-layout";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { getSpaceApiKeys, isApiAccessEnabled } from "@/features/api-keys/data";
import { getActiveSpaceForUser } from "@/features/space/data";
import { getCurrentUser } from "@/features/user/data";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { getPathname } from "@/lib/pathname";
import { buildSafeRedirectUrl } from "@/lib/utils/redirect";
import { ApiKeysList } from "./components/api-keys-list";
import { CreateApiKeyButton } from "./components/create-api-key-button";

export default async function ApiKeysSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      buildSafeRedirectUrl({
        destination: "/login",
        returnUrl: await getPathname(),
      }),
    );
  }

  const space = await getActiveSpaceForUser(user.id);

  if (!space || !(await isApiAccessEnabled(user, space))) {
    notFound();
  }

  const apiKeys = await getSpaceApiKeys(space.id);

  return (
    <SettingsPage>
      <SettingsPageHeader className="flex-row items-center justify-between">
        <div>
          <SettingsPageTitle>
            <Trans i18nKey="apiKeys" defaults="API Keys" />
          </SettingsPageTitle>
          <SettingsPageDescription>
            <Trans
              i18nKey="apiKeysDescription"
              defaults="Manage API keys for programmatic access to your space"
            />
          </SettingsPageDescription>
        </div>
        <CreateApiKeyButton />
      </SettingsPageHeader>
      <SettingsPageContent>
        <PageSectionGroup>
          <PageSection>
            <PageSectionContent>
              <ApiKeysList apiKeys={apiKeys} />
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
    title: t("apiKeys", {
      defaultValue: "API Keys",
    }),
    description: t("apiKeysSettingsDescription", {
      defaultValue:
        "Create and manage API keys for programmatic access to your space.",
    }),
  };
}
