import { subject } from "@casl/ability";
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

  // Only work spaces are asked — personal-space users aren't prompted at
  // setup and must not be nagged here. The industry half prompts on a stored
  // null rather than on un-inferability: a space whose sector we could guess
  // still holds an unconfirmed guess, and that is precisely the data point
  // that can't be trusted. It is only worth asking of someone who can act on
  // it, so members who can't edit the space are asked about their role alone.
  const needsWorkDetails =
    space.spaceType === "work" &&
    (!user.jobTitle ||
      (!space.industry && ability.can("update", subject("Space", space))));

  return (
    <DashboardHome
      openPollCount={pollStatusCounts.open}
      upcomingEventCount={upcomingEventCount}
      memberCount={space.memberCount}
      seatCount={space.seatCount}
      hasNoAccounts={hasNoAccounts}
      canManageBilling={ability.can("manage", "Billing")}
      needsWorkDetails={needsWorkDetails}
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
