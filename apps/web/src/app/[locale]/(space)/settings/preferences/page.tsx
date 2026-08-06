import type { Metadata } from "next";
import { LocalizationPreferences } from "@/app/[locale]/(space)/settings/preferences/components/localization-preferences";
import { ThemePreference } from "@/app/[locale]/(space)/settings/preferences/components/theme-preference";
import type { Params } from "@/app/[locale]/types";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/components/page-layout";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/components/settings-layout";
import { requireUser } from "@/features/user/loaders";
import { Trans } from "@/i18n/client";
import { getTranslation } from "@/i18n/server";

export default async function Page() {
  const user = await requireUser();

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
        <PageSectionGroup>
          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans
                  i18nKey="languageAndRegion"
                  defaults="Language & region"
                />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="languageAndRegionDescription"
                  defaults="Set your language, time zone, and date and time formats"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <LocalizationPreferences
                initialValues={{
                  locale: user.locale,
                  timeFormat: user.timeFormat,
                  timeZone: user.timeZone,
                  weekStart: user.weekStart,
                }}
              />
            </PageSectionContent>
          </PageSection>

          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="theme" defaults="Theme" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="themeDescription"
                  defaults="Choose your preferred appearance"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <ThemePreference />
            </PageSectionContent>
          </PageSection>
        </PageSectionGroup>
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
