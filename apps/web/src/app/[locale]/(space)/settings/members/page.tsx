import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getActiveSpace, getSpaceSeatCount } from "@/features/space/data";
import { getTotalSeatsForSpace } from "@/features/space/utils";
import { getTranslation } from "@/i18n/server";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { MembersSettingsPageClient } from "./page-client";

export default async function MembersSettingsPage() {
  const [space, helpers] = await Promise.all([
    getActiveSpace(),
    createPrivateSSRHelper(),
  ]);

  const [totalSeats, usedSeats] = await Promise.all([
    getTotalSeatsForSpace(space.id),
    getSpaceSeatCount(space.id),
    helpers.spaces.listMembers.prefetch(),
    helpers.spaces.listInvites.prefetch(),
  ]);

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <MembersSettingsPageClient
        totalSeats={totalSeats}
        usedSeats={usedSeats}
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
