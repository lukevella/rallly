import type { Metadata } from "next";
import { getPollStatusCounts } from "@/features/poll/data";
import { getUpcomingEventCount } from "@/features/scheduled-event/data";
import { getActiveSpace } from "@/features/space/loaders";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { getUserHasNoAccounts } from "@/features/user/data";
import { requireUser } from "@/features/user/loaders";
import { getTranslation } from "@/i18n/server";
import { getDeviceTimeZone } from "@/lib/datetime/server";
import { normalizeTimeZone } from "@/lib/datetime/utils";
import { DashboardHome } from "./dashboard-home";

export default async function Page() {
  const [user, space, deviceTimeZone] = await Promise.all([
    requireUser(),
    getActiveSpace(),
    getDeviceTimeZone(),
  ]);

  // The device zone is the viewer's present; the stored preference is a
  // fallback for devices whose zone cookie hasn't been set yet.
  const timeZone = deviceTimeZone ?? normalizeTimeZone(user.timeZone) ?? "UTC";

  const [pollStatusCounts, upcomingEventCount, hasNoAccounts] =
    await Promise.all([
      getPollStatusCounts({ spaceId: space.id }),
      getUpcomingEventCount({ spaceId: space.id, timeZone }),
      getUserHasNoAccounts(user.id),
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
