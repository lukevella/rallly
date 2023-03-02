import { prisma } from "@rallly/database";
import { sendEmail } from "@rallly/emails";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { absoluteUrl } from "../../../utils/absolute-url";
import {
  createToken,
  decryptToken,
  mergeGuestsIntoUser,
} from "../../../utils/auth";
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
      const { pollId } = await decryptToken<{
        pollId: string;
      }>(input.code);

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
  request: publicProcedure
    .input(
      z.object({
        pollId: z.string(),
        adminUrlId: z.string(),
      }),
    )
    .mutation(async ({ input: { pollId, adminUrlId } }) => {
      const poll = await prisma.poll.findUnique({
        where: {
          id: pollId,
        },
        include: {
          user: true,
        },
      });

      if (!poll) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Poll with id ${pollId} not found`,
        });
      }

      const pollUrl = absoluteUrl(`/admin/${adminUrlId}`);
      const token = await createToken({
        pollId,
      });
      const verifyEmailUrl = `${pollUrl}?code=${token}`;

      await sendEmail("GuestVerifyEmail", {
        to: poll.user.email,
        subject: "Please verify your email address",
        props: {
          title: poll.title,
          name: poll.user.name,
          adminLink: pollUrl,
          verificationLink: verifyEmailUrl,
        },
      });
    }),
});
