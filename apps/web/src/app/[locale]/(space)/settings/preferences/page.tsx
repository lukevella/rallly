import type { Metadata } from "next";
import { DateTimePreferences } from "@/app/[locale]/(space)/settings/preferences/components/date-time-preferences";
import { LanguagePreference } from "@/app/[locale]/(space)/settings/preferences/components/language-preference";
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
                <Trans i18nKey="language" defaults="Language" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="languageDescription"
                  defaults="Change your preferred language"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <LanguagePreference defaultValue={user.locale} />
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

          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="dateAndTime" defaults="Date & Time" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="dateAndTimeDescription"
                  defaults="Change your preferred date and time settings"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <DateTimePreferences
                initialValues={{
                  timeFormat: user.timeFormat,
                  timeZone: user.timeZone,
                  weekStart: user.weekStart,
                }}
              />
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
