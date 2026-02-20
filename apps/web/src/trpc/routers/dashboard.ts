import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { getActiveSpaceForUser } from "@/features/space/data";
import type { MemberAbilityContext } from "@/features/space/member/ability";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { getTotalSeatsForSpace } from "@/features/space/utils";
import { dayjs } from "@/lib/dayjs";
import { privateProcedure, router } from "../trpc";

export const dashboard = router({
  stats: privateProcedure.query(async ({ ctx }) => {
    const space = await getActiveSpaceForUser(ctx.user.id);

    if (!space) {
      return null;
    }

    const now = new Date();
    const todayStart = dayjs()
      .tz(ctx.user.timeZone ?? "UTC")
      .startOf("day")
      .toDate();

    const upcomingEventsWhere: Prisma.ScheduledEventWhereInput = {
      spaceId: space.id,
      deletedAt: null,
      status: "confirmed",
      OR: [
        { allDay: false, start: { gte: now } },
        { allDay: true, start: { gte: todayStart } },
      ],
    };

    const [
      openPollCount,
      upcomingEventCount,
      memberCount,
      seatCount,
      accountCount,
    ] = await Promise.all([
      prisma.poll.count({
        where: {
          spaceId: space.id,
          status: "open",
          deleted: false,
        },
      }),
      prisma.scheduledEvent.count({ where: upcomingEventsWhere }),
      prisma.spaceMember.count({ where: { spaceId: space.id } }),
      getTotalSeatsForSpace(space.id),
      prisma.account.count({ where: { userId: ctx.user.id } }),
    ]);

    const ability = defineAbilityForMember({
      user: { id: ctx.user.id },
      space,
    } satisfies MemberAbilityContext);

    return {
      openPollCount,
      upcomingEventCount,
      memberCount,
      seatCount,
      hasNoAccounts: accountCount === 0,
      canManageBilling: ability.can("manage", "Billing"),
    };
  }),
});
