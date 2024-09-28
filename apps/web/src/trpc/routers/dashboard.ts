import { prisma } from "@rallly/database";
import dayjs from "dayjs";

import { shortUrl } from "@/utils/absolute-url";

import { possiblyPublicProcedure, router } from "../trpc";

export const dashboard = router({
  info: possiblyPublicProcedure.query(async ({ ctx }) => {
    const activePollCount = await prisma.poll.count({
      where: {
        userId: ctx.user.id,
        status: "live",
        deleted: false, // TODO (Luke Vella) [2024-06-16]: We should add deleted/cancelled to the status enum
      },
    });

    return { activePollCount };
  }),
  getPending: possiblyPublicProcedure.query(async ({ ctx }) => {
    const polls = await prisma.poll.findMany({
      where: {
        userId: ctx.user.id,
        status: "live",
        deleted: false,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        status: true,
        options: {
          select: {
            startTime: true,
            duration: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
      take: 3,
    });

    return polls.map((poll) => {
      return {
        id: poll.id,
        title: poll.title,
        createdAt: poll.createdAt,
        range: {
          start: poll.options[0].startTime,
          end: dayjs(poll.options[poll.options.length - 1].startTime)
            .add(poll.options[poll.options.length - 1].duration, "minute")
            .toDate(),
        },
        status: poll.status,
        responseCount: poll._count.participants,
        inviteLink: shortUrl(`/invite/${poll.id}`),
      };
    });
  }),
});
