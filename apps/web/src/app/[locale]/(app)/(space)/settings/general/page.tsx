import type { Metadata } from "next";
import { getTranslation } from "@/i18n/server";
import { GeneralSettingsPageClient } from "./page-client";

export default function GeneralSettingsPage() {
  return <GeneralSettingsPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("generalSettings", {
      defaultValue: "General Settings",
    }),
    description: t("generalSettingsDescription", {
      defaultValue:
        "Manage your space settings, including name, description, and other general preferences.",
    }),
  };
}
