import type { Metadata } from "next";
import { loadPollStatusCounts } from "@/features/poll/loaders";
import {
  loadActiveSpace,
  loadUpcomingEventCount,
} from "@/features/space/loaders";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { loadUser, loadUserHasNoAccounts } from "@/features/user/loaders";
import { getTranslation } from "@/i18n/server";
import { DashboardHome } from "./dashboard-home";

export default async function Page() {
  const [user, space, pollStatusCounts, upcomingEventCount, hasNoAccounts] =
    await Promise.all([
      loadUser(),
      loadActiveSpace(),
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
      canManageMembers={space.role === "admin"}
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
