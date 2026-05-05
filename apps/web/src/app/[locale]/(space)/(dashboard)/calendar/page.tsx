import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslation } from "@/i18n/server";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { CalendarPage } from "./calendar-page";

export default async function Page() {
  if (!isFeatureEnabled("calendars")) {
    notFound();
  }

  return <CalendarPage />;
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("calendar", {
      defaultValue: "Calendar",
    }),
  };
}
