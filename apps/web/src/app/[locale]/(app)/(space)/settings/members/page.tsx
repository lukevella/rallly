import type { Metadata } from "next";
import { getTranslation } from "@/i18n/server";
import { MembersSettingsPageClient } from "./page-client";

export default function MembersSettingsPage() {
  return <MembersSettingsPageClient />;
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("members", {
      defaultValue: "Members",
    }),
    description: t("membersSettingsDescription", {
      defaultValue:
        "Manage space members, invite new users, and control access permissions.",
    }),
  };
}
