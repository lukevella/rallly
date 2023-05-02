import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { decryptToken } from "../../session";
import { publicProcedure, router } from "../trpc";
import { LoginTokenPayload, UserSession } from "../types";

export const whoami = router({
  get: publicProcedure.query(async ({ ctx }): Promise<UserSession> => {
    if (ctx.user.isGuest) {
      return { isGuest: true, id: ctx.user.id };
    }

    const user = await prisma.user.findUnique({
      select: { id: true, name: true, email: true },
      where: { id: ctx.user.id },
    });

    if (user === null) {
      ctx.session.destroy();
      throw new Error("User not found");
    }

    return { isGuest: false, ...user };
  }),
  destroy: publicProcedure.mutation(async ({ ctx }) => {
    ctx.session.destroy();
  }),
  authenticate: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payload = await decryptToken<LoginTokenPayload>(input.token);

      if (!payload) {
        // token is invalid or expired
        throw new TRPCError({ code: "PARSE_ERROR", message: "Invalid token" });
      }

      const user = await prisma.user.findFirst({
        select: {
          id: true,
          name: true,
          email: true,
        },
        where: { id: payload.userId },
      });

      if (!user) {
        // user does not exist
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      ctx.session.user = { id: user.id, isGuest: false };

      await ctx.session.save();

      return user;
    }),
});
