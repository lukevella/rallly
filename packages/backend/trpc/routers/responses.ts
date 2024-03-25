import { prisma } from "@rallly/database";
import { z } from "zod";

import { publicProcedure, router } from "../trpc";

export const responses = router({
  list: publicProcedure
    .input(
      z.object({
        pagination: z.object({
          pageIndex: z.number(),
          pageSize: z.number(),
        }),
      }),
    )
    .query(async ({ input, ctx }) => {
      const [total, responses] = await prisma.$transaction([
        prisma.participant.count({
          where: {
            userId: ctx.user.id,
          },
        }),
        prisma.participant.findMany({
          where: {
            userId: ctx.user.id,
          },
          select: {
            id: true,
            name: true,
            pollId: true,
            createdAt: true,
            poll: {
              select: {
                title: true,
                user: {
                  select: {
                    name: true,
                  },
                },
                status: true,
                event: {
                  select: {
                    start: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip: input.pagination.pageIndex * input.pagination.pageSize,
          take: input.pagination.pageSize,
        }),
      ]);

      return { total, responses };
    }),
});
