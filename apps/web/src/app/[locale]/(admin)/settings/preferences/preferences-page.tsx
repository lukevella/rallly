"use client";

import { DateTimePreferences } from "@/app/[locale]/(admin)/settings/components/date-time-preferences";
import { LanguagePreference } from "@/app/[locale]/(admin)/settings/components/language-preference";
import {
  SettingsContent,
  SettingsSection,
} from "@/app/[locale]/(admin)/settings/components/settings-layout";
import { Trans } from "@/components/trans";

export function PreferencesPage() {
  return (
    <SettingsContent>
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
  );
}
