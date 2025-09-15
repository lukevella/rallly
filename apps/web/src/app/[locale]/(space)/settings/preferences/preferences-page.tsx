"use client";

import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionGroup,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import { Trans } from "@/components/trans";
import { DateTimePreferences } from "./components/date-time-preferences";
import { LanguagePreference } from "./components/language-preference";

export function PreferencesPage() {
  return (
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
          <LanguagePreference />
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
          <DateTimePreferences />
        </PageSectionContent>
      </PageSection>
    </PageSectionGroup>
  );
}
