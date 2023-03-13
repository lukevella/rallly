import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { decryptToken, mergeGuestsIntoUser } from "../../../utils/auth";
import { publicProcedure, router } from "../../trpc";

export const verification = router({
  verify: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
        code: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const payload = await decryptToken<{
        pollId: string;
      }>(input.code);

      if (!payload) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid token",
        });
      }

      const { pollId } = payload;

      if (pollId !== input.pollId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Poll id in token (${pollId}) did not match: ${input.pollId}`,
        });
      }

      const poll = await prisma.poll.update({
        where: {
          id: pollId,
        },
        data: {
          verified: true,
          notifications: true,
        },
        include: { user: true },
      });

      // If logged in as guest, we update all participants
      // and comments by this guest to the user that we just authenticated
      if (ctx.session.user?.isGuest) {
        await mergeGuestsIntoUser(poll.user.id, [ctx.session.user.id]);
      }

      ctx.session.user = {
        id: poll.user.id,
        isGuest: false,
      };
      await ctx.session.save();
    }),
});
