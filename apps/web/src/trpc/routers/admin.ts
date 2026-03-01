import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import { updateTag } from "next/cache";
import * as z from "zod";
import { instanceSettingsTag } from "@/features/instance-settings/constants";
import { instanceSettingsSchema } from "@/features/instance-settings/schema";
import { defineAbilityFor } from "@/features/user/ability";
import { userRoleSchema } from "@/features/user/schema";
import { isInitialAdmin } from "@/utils/is-initial-admin";
import { adminProcedure, privateProcedure, router } from "../trpc";

export const admin = router({
  changeRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: userRoleSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, role } = input;

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `User ${userId} not found`,
        });
      }

      if (targetUser.role === role) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is already this role",
        });
      }

      const ability = defineAbilityFor(ctx.user);

      if (ability.cannot("update", subject("User", targetUser), "role")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Current user is not authorized to update role",
        });
      }

      await prisma.user.update({
        where: { id: targetUser.id },
        data: { role },
      });
    }),
  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          subscriptions: {
            select: { active: true },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (user.subscriptions.some((subscription) => subscription.active)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User has active subscriptions",
        });
      }

      await prisma.user.delete({
        where: { id: input.userId },
      });
    }),
  updateInstanceSettings: adminProcedure
    .input(instanceSettingsSchema)
    .mutation(async ({ input }) => {
      await prisma.instanceSettings.update({
        where: { id: 1 },
        data: input,
      });

      updateTag(instanceSettingsTag);
    }),
  makeMeAdmin: privateProcedure.mutation(async ({ ctx }) => {
    if (!isInitialAdmin(ctx.user.email)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to update your role",
      });
    }

    await prisma.user.update({
      where: { id: ctx.user.id },
      data: { role: "admin" },
    });
  }),
});
