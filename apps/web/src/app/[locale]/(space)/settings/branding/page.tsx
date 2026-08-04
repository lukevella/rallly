import type { Metadata } from "next";
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

export default function BrandingSettingsPage() {
  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="branding" defaults="Branding" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="brandingCardDescription"
            defaults="How your space appears to you and the people you invite"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        <BrandingSettings />
      </SettingsPageContent>
    </SettingsPage>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("branding", {
      defaultValue: "Branding",
    }),
  };
}
