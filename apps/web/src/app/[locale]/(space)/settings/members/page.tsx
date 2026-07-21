import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getSeatUsage } from "@/features/space/data";
import { getTranslation } from "@/i18n/server";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { MembersSettingsPageClient } from "./page-client";

export default async function MembersSettingsPage() {
  const [seatUsage, helpers] = await Promise.all([
    getSeatUsage(),
    createPrivateSSRHelper(),
  ]);

  await Promise.all([
    helpers.spaces.listMembers.prefetch(),
    helpers.spaces.listInvites.prefetch(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <MembersSettingsPageClient
        totalSeats={seatUsage.total}
        usedSeats={seatUsage.used}
      />
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
