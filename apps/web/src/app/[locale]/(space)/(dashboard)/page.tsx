import type { Metadata } from "next";
import { loadPollStatusCounts } from "@/features/poll/loaders";
import {
  getActiveSpace,
  loadUpcomingEventCount,
} from "@/features/space/loaders";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { loadUserHasNoAccounts, requireUser } from "@/features/user/loaders";
import { getTranslation } from "@/i18n/server";
import { DashboardHome } from "./dashboard-home";

export default async function Page() {
  const [user, space, pollStatusCounts, upcomingEventCount, hasNoAccounts] =
    await Promise.all([
      requireUser(),
      getActiveSpace(),
      loadPollStatusCounts(),
      loadUpcomingEventCount(),
      loadUserHasNoAccounts(),
    ]);

  const ability = defineAbilityForMember({ user: { id: user.id }, space });

  return (
    <DashboardHome
      openPollCount={pollStatusCounts.open}
      upcomingEventCount={upcomingEventCount}
      memberCount={space.memberCount}
      seatCount={space.seatCount}
      hasNoAccounts={hasNoAccounts}
      canManageBilling={ability.can("manage", "Billing")}
    />
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("home", {
      defaultValue: "Home",
    }),
  };
}
