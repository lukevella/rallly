import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getTranslation } from "@/i18n/server";
import { createPrivateSSRHelper } from "@/trpc/next/ssr";
import { MembersSettingsPageClient } from "./page-client";

export default async function MembersSettingsPage() {
  const helpers = await createPrivateSSRHelper();

  await Promise.all([
    helpers.spaces.listMembers.prefetch(),
    helpers.spaces.listInvites.prefetch(),
    helpers.spaces.getSeats.prefetch(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <MembersSettingsPageClient />
    </HydrationBoundary>
  );
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
