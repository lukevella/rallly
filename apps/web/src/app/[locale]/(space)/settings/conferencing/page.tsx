import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSection, PageSectionContent } from "@/components/page-layout";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { Spinner } from "@/components/spinner";
import { ConferencingConnectionFlash } from "@/features/conferencing/components/conferencing-connection-flash";
import { ConferencingProviderList } from "@/features/conferencing/components/conferencing-provider-list";
import {
  loadAvailableConferencingProviders,
  loadConferencingConnections,
} from "@/features/conferencing/loaders";
import type { ConferencingProvider } from "@/features/conferencing/schema";
import { conferencingProviderSchema } from "@/features/conferencing/schema";
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
      </SettingsPageHeader>
      <SettingsPageContent>
        <PageSection>
          <PageSectionContent>
            <Suspense fallback={<Spinner />}>
              <ProviderList />
            </Suspense>
          </PageSectionContent>
        </PageSection>
      </SettingsPageContent>
    </SettingsPage>
  );
}

async function ProviderList() {
  const [available, connections] = await Promise.all([
    loadAvailableConferencingProviders(),
    loadConferencingConnections(),
  ]);
  // The stored provider is the OAuth provider ("google"); the form and icons
  // speak in conferencing providers, which the integration id identifies.
  const connected = new Map<
    ConferencingProvider,
    { id: string; email: string }
  >();
  for (const connection of connections) {
    const provider = integrationIdToConferencingProvider(
      connection.integrationId,
    );
    // Connections come oldest first, and the oldest is the one finalizing uses.
    if (provider && !connected.has(provider)) {
      connected.set(provider, { id: connection.id, email: connection.email });
    }
  }
  // A provider no longer offered stays listed while connected, so it can
  // still be disconnected.
  const providers = conferencingProviderSchema.options.filter(
    (provider) => available.includes(provider) || connected.has(provider),
  );
  return (
    <ConferencingProviderList
      providers={providers.map((provider) => ({
        provider,
        connection: connected.get(provider) ?? null,
      }))}
    />
  );
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
