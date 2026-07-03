import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import * as z from "zod";
import { upcomingScheduledEventWhere } from "@/features/scheduled-event/predicates";
import type { MemberAbilityContext } from "@/features/space/member/ability";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { getTotalSeatsForSpace } from "@/features/space/utils";
import { timeZoneSchema } from "@/lib/datetime/schema";
import { normalizeTimeZone } from "@/lib/datetime/utils";
import { router, spaceProcedure } from "../trpc";

export const dashboard = router({
  stats: spaceProcedure
    .input(z.object({ timeZone: timeZoneSchema.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { space } = ctx;
      const timeZone =
        input?.timeZone ?? normalizeTimeZone(ctx.user.timeZone) ?? "UTC";

      const upcomingEventsWhere: Prisma.ScheduledEventWhereInput = {
        spaceId: space.id,
        ...upcomingScheduledEventWhere({ now: new Date(), timeZone }),
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
