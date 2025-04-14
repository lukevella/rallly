"use client";

import { Trans } from "@/components/trans";

import { DateTimePreferences } from "../components/date-time-preferences";
import { LanguagePreference } from "../components/language-preference";
import {
  SettingsContent,
  SettingsSection,
} from "../components/settings-layout";

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
