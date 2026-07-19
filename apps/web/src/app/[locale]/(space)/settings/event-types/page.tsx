import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventTypes } from "@/features/event-types/data";
import { getActiveSpace } from "@/features/space/data";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { EventTypesSettingsPage } from "./event-types-settings-page";

export default async function Page() {
  if (!isFeatureEnabled("eventTypes")) {
    notFound();
  }

  const space = await getActiveSpace();
  const eventTypes = await getEventTypes(space.id);

  return <EventTypesSettingsPage eventTypes={eventTypes} />;
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("eventTypes", {
      defaultValue: "Event Types",
    }),
  };
}
