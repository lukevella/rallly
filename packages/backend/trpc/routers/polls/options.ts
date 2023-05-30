import { prisma } from "@rallly/database";
import { z } from "zod";

import { publicProcedure, router } from "../../trpc";

export const options = router({
  list: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
      }),
    )
    .query(async ({ input: { pollId } }) => {
      const options = await prisma.option.findMany({
        where: {
          pollId,
        },
        select: {
          id: true,
          start: true,
          duration: true,
        },
        orderBy: [
          {
            start: "asc",
          },
        ],
      });

      return options;
    }),
  delete: publicProcedure
    .input(
      z.object({
        optionId: z.string(),
      }),
    )
    .mutation(async ({ input: { optionId } }) => {
      await prisma.option.delete({
        where: {
          id: optionId,
        },
      });
    }),
});
