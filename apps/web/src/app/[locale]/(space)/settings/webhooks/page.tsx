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
import { getActiveSpace } from "@/features/space/loaders";
import { CreateWebhookButton } from "@/features/webhook/components/create-webhook-button";
import { WebhooksList } from "@/features/webhook/components/webhooks-list";
import { WebhooksUpgrade } from "@/features/webhook/components/webhooks-upgrade";
import {
  loadSpaceWebhooks,
  loadWebhooksEnabled,
} from "@/features/webhook/loaders";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";

export default async function WebhooksSettingsPage() {
  const space = await getActiveSpace();
  const enabled = await loadWebhooksEnabled();

  // "Needs to upgrade" (hobby tier) gets its own screen; every other reason
  // access is blocked (self-hosted, not the owner) is a 404.
  if (!enabled && space.tier !== "hobby") {
    notFound();
  }

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="webhooks" defaults="Webhooks" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="webhooksDescription"
            defaults="Send poll events to your own endpoints"
          />
        </SettingsPageDescription>
        {enabled ? (
          <SettingsPageAction>
            <CreateWebhookButton />
          </SettingsPageAction>
        ) : null}
      </SettingsPageHeader>
      <SettingsPageContent>
        {enabled ? <WebhooksContent /> : <WebhooksUpgrade />}
      </SettingsPageContent>
    </SettingsPage>
  );
}

async function WebhooksContent() {
  const webhooks = await loadSpaceWebhooks();

  return (
    <PageSectionGroup>
      <PageSection>
        <PageSectionContent>
          <WebhooksList webhooks={webhooks} />
        </PageSectionContent>
      </PageSection>
    </PageSectionGroup>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("webhooks", {
      defaultValue: "Webhooks",
    }),
    description: t("webhooksSettingsDescription", {
      defaultValue:
        "Send poll events to your own endpoints with signed, retried deliveries.",
    }),
  };
}
