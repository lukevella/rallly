import type { Metadata } from "next";
import type { Params } from "@/app/[locale]/types";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/app/components/settings-layout";
import { Trans } from "@/components/trans";
import { getTranslation } from "@/i18n/server";
import { PreferencesPage } from "./preferences-page";

export default async function Page() {
  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="preferences" defaults="Preferences" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="preferencesDescription"
            defaults="Manage your preferences"
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent>
        <PreferencesPage />
      </SettingsPageContent>
    </SettingsPage>
  );
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("preferences"),
  };
}
