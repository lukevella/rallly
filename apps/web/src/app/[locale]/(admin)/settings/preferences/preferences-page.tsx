"use client";
import Head from "next/head";

import { useTranslation } from "@/app/i18n/client";
import { DateTimePreferences } from "@/components/settings/date-time-preferences";
import { LanguagePreference } from "@/components/settings/language-preference";
import {
  Settings,
  SettingsContent,
  SettingsSection,
} from "@/components/settings/settings";
import { Trans } from "@/components/trans";

export function PreferencesPage() {
  const { t } = useTranslation();

  return (
    <Settings>
      <SettingsContent>
        <Head>
          <title>{t("settings")}</title>
        </Head>
        <SettingsSection
          title={<Trans i18nKey="language" defaults="Language" />}
          description={
            <Trans
              i18nKey="languageDescription"
              defaults="Change your preferred language"
            />
          }
        >
          <LanguagePreference />
        </SettingsSection>
        <hr />
        <SettingsSection
          title={<Trans i18nKey="dateAndTime" defaults="Date & Time" />}
          description={
            <Trans
              i18nKey="dateAndTimeDescription"
              defaults="Change your preferred date and time settings"
            />
          }
        >
          <DateTimePreferences />
        </SettingsSection>
      </SettingsContent>
    </Settings>
  );
}
