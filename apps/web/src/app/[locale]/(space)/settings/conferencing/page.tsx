import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSection, PageSectionContent } from "@/components/page-layout";
import {
  SettingsPage,
  SettingsPageAction,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { Spinner } from "@/components/spinner";
import { ConferencingConnectionFlash } from "@/features/conferencing/components/conferencing-connection-flash";
import { ConferencingConnectionList } from "@/features/conferencing/components/conferencing-connection-list";
import { ConnectConferencingDropdown } from "@/features/conferencing/components/connect-conferencing-dropdown";
import {
  loadAvailableConferencingProviders,
  loadConferencingConnections,
} from "@/features/conferencing/loaders";
import { integrationIdToConferencingProvider } from "@/features/conferencing/utils";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";

// The page exists for a user only while some provider is offered to them.
async function AvailabilityGate() {
  const providers = await loadAvailableConferencingProviders();
  if (providers.length === 0) {
    notFound();
  }
  return null;
}

async function ConnectAction() {
  const providers = await loadAvailableConferencingProviders();
  return <ConnectConferencingDropdown providers={providers} />;
}

export default function ConferencingPage() {
  if (!isFeatureEnabled("conferencing")) {
    notFound();
  }

  return (
    <SettingsPage>
      <Suspense fallback={null}>
        <AvailabilityGate />
      </Suspense>
      <ConferencingConnectionFlash />
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="conferencing" defaults="Conferencing" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="conferencingDescription"
            defaults="Connect the tools you use for video calls so we can add meeting links to your events."
          />
        </SettingsPageDescription>
        <SettingsPageAction>
          <Suspense fallback={null}>
            <ConnectAction />
          </Suspense>
        </SettingsPageAction>
      </SettingsPageHeader>
      <SettingsPageContent>
        <PageSection>
          <PageSectionContent>
            <Suspense fallback={<Spinner />}>
              <ConnectionList />
            </Suspense>
          </PageSectionContent>
        </PageSection>
      </SettingsPageContent>
    </SettingsPage>
  );
}

async function ConnectionList() {
  const connections = await loadConferencingConnections();
  // The stored provider is the OAuth provider ("google"); the form and icons
  // speak in conferencing providers, which the integration id identifies.
  const items = connections.flatMap((connection) => {
    const provider = integrationIdToConferencingProvider(
      connection.integrationId,
    );
    return provider ? [{ ...connection, provider }] : [];
  });
  return <ConferencingConnectionList connections={items} />;
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("conferencing", { defaultValue: "Conferencing" }),
    description: t("conferencingDescription", {
      defaultValue:
        "Connect the tools you use for video calls so we can add meeting links to your events.",
    }),
  };
}
