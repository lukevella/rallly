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
import { CreateWebhookButton } from "@/features/webhook/components/create-webhook-button";
import { WebhooksList } from "@/features/webhook/components/webhooks-list";
import { WebhooksUpgrade } from "@/features/webhook/components/webhooks-upgrade";
import {
  loadSpaceWebhooks,
  loadWebhookAccess,
} from "@/features/webhook/loaders";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";

export default async function WebhooksSettingsPage() {
  const access = await loadWebhookAccess();

  // Only a space that could fix this by paying gets the upgrade screen;
  // every other denial (self-hosted, not the owner) is a 404, since a pay
  // wall would offer something buying Pro would not deliver.
  if (access === "denied") {
    notFound();
  }

  const enabled = access === "allowed";

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="webhooks" defaults="Webhooks" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="webhooksDescription"
            defaults="Send events to your own server"
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
        "Send events to your own server with signed, retried deliveries.",
    }),
  };
}
