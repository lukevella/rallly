import { Alert, AlertDescription } from "@rallly/ui/alert";
import { GemIcon } from "lucide-react";
import type { Metadata } from "next";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { DEFAULT_PRIMARY_COLOR } from "@/features/branding/constants";
import { loadBrandingSettings } from "@/features/branding/loaders";
import { loadWhiteLabelAddon } from "@/features/licensing/loaders";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { BrandingSettingsForm } from "./branding-settings-form";

async function loadData() {
  const [settings, hasWhiteLabelAddon] = await Promise.all([
    loadBrandingSettings(),
    loadWhiteLabelAddon(),
  ]);

  return {
    hasWhiteLabelAddon,
    defaultValue: {
      appName: settings.appName,
      primaryColor: settings.primaryColor ?? DEFAULT_PRIMARY_COLOR,
      primaryColorDark: settings.primaryColorDark,
      logoUrl: settings.logoUrl,
      logoUrlDark: settings.logoUrlDark,
      logoIconUrl: settings.logoIconUrl,
      hideAttribution: settings.hideAttribution,
    },
  };
}

export default async function BrandingPage() {
  const { hasWhiteLabelAddon, defaultValue } = await loadData();

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="branding" defaults="Branding" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="brandingDescription"
            defaults="Customize how your instance looks"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        {!hasWhiteLabelAddon ? (
          <Alert variant="primary">
            <GemIcon />
            <AlertDescription className="flex gap-2">
              <p className="flex-1">
                <Trans
                  i18nKey="customBrandingAlertDescription"
                  defaults="Custom branding is available to Enterprise license holders as a paid add-on."
                />
              </p>
              <p>
                <a
                  href="https://support.rallly.co/self-hosting/white-labeling"
                  target="_blank"
                  className="underline"
                  rel="noreferrer"
                >
                  <Trans i18nKey="learnMore" defaults="Learn more" />
                </a>
              </p>
            </AlertDescription>
          </Alert>
        ) : null}
        <BrandingSettingsForm
          defaultValue={defaultValue}
          disabled={!hasWhiteLabelAddon}
        />
      </SettingsPageContent>
    </SettingsPage>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await getTranslation(locale);
  return {
    title: t("branding", { defaultValue: "Branding" }),
  };
}
