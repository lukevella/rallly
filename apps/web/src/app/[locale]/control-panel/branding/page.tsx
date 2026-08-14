import type { Metadata } from "next";
import { Suspense } from "react";
import { RouterLoadingIndicator } from "@/components/router-loading-indicator";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";
import { BrandingSettings } from "./components/branding-settings";

export default function BrandingPage() {
  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="branding" defaults="Branding" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="brandingSettingsDescription"
            defaults="Customize your instance branding"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        <Suspense fallback={<RouterLoadingIndicator />}>
          <BrandingSettings />
        </Suspense>
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
