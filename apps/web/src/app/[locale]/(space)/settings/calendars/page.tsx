import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionDivider,
  PageSectionHeader,
  PageSectionTitle,
} from "@/app/components/page-layout";
import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/app/components/settings-layout";
import { Trans } from "@/components/trans";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { createSSRHelper } from "@/trpc/server/create-ssr-helper";
import { CalendarConnectionList } from "./components/calendar-connection-list";
import { ConnectCalendarDropdown } from "./components/connect-calendar-dropdown";
import { DefaultCalendarSelect } from "./components/default-calendar-select";

export default async function CalendarsPage() {
  const isCalendarsEnabled = isFeatureEnabled("calendars");

  if (!isCalendarsEnabled) {
    return notFound();
  }

  const trpc = await createSSRHelper();

  await trpc.calendars.list.prefetch();

  return (
    <HydrationBoundary state={dehydrate(trpc.queryClient)}>
      <SettingsPage>
        <div className="flex justify-between">
          <SettingsPageHeader>
            <SettingsPageTitle>
              <Trans i18nKey="calendars" defaults="Calendars" />
            </SettingsPageTitle>
            <SettingsPageDescription>
              <Trans
                i18nKey="calendarsDescription"
                defaults="Manage your calendar connections"
              />
            </SettingsPageDescription>
          </SettingsPageHeader>
          <div>
            <ConnectCalendarDropdown />
          </div>
        </div>
        <SettingsPageContent>
          <PageSection variant="card">
            <PageSectionHeader>
              <PageSectionTitle>
                <Trans i18nKey="defaultCalendar" defaults="Default Calendar" />
              </PageSectionTitle>
              <PageSectionDescription>
                <Trans
                  i18nKey="defaultCalendarDescription"
                  defaults="Select the calendar that we should create events in"
                />
              </PageSectionDescription>
            </PageSectionHeader>
            <PageSectionContent>
              <DefaultCalendarSelect />
            </PageSectionContent>
          </PageSection>
          <PageSectionDivider />
          <CalendarConnectionList />
        </SettingsPageContent>
      </SettingsPage>
    </HydrationBoundary>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("calendars", "Calendars"),
    description: t("calendarsDescription", "Manage your calendar connections"),
  };
}
