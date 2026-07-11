import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { sendRawEmail } from "@rallly/emails";
import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { posthog } from "@/features/analytics/posthog";
import { feedbackSchema } from "@/features/feedback/schema";
import { defaultNotificationPreferences } from "@/features/notifications/constants";
import { getNotificationPreferences } from "@/features/notifications/data";
import { activityEventTypes } from "@/features/notifications/schema";
import { defineAbilityFor } from "@/features/user/ability";
import {
  createRateLimitMiddleware,
  privateProcedure,
  publicProcedure,
  router,
} from "../trpc";

export const user = router({
  getMe: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    return ctx.user;
  }),
  getAuthed: privateProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
  deleteMe: privateProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          select: {
            active: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const ability = defineAbilityFor(ctx.user);

    if (ability.cannot("delete", subject("User", user))) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to delete this user",
      });
    }

    if (user.subscriptions.some((subscription) => subscription.active)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User has active subscriptions",
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });
  }),
  getNotificationPreferences: privateProcedure.query(async ({ ctx }) => {
    return getNotificationPreferences(ctx.user.id);
  }),
  updateNotificationPreference: privateProcedure
    .input(
      z.object({
        eventType: z.enum(activityEventTypes),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.userNotificationPreferences.findUnique({
        where: { userId: ctx.user.id },
        select: { prefs: true },
      });

      const updatedPrefs = {
        ...defaultNotificationPreferences,
        ...(existing?.prefs as object),
        [input.eventType]: input.enabled,
      };

      await prisma.userNotificationPreferences.upsert({
        where: { userId: ctx.user.id },
        create: {
          userId: ctx.user.id,
          prefs: updatedPrefs,
        },
        update: {
          prefs: updatedPrefs,
        },
      });

      posthog()?.capture({
        event: "notification_preference_update",
        distinctId: ctx.user.id,
        properties: {
          eventType: input.eventType,
          enabled: input.enabled,
        },
      });
    }),
  updateLocale: privateProcedure
    .input(z.object({ locale: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.user.update({
        where: { id: ctx.user.id },
        data: { locale: input.locale },
      });
    }),
  submitFeedback: privateProcedure
    .use(createRateLimitMiddleware("submit_feedback", 5, "1 h"))
    .input(feedbackSchema)
    .mutation(async ({ input, ctx }) => {
      sendRawEmail({
        to: "feedback@rallly.co",
        replyTo: ctx.user.email ?? undefined,
        subject: "Feedback",
        text: `User: ${ctx.user.name} (${ctx.user.email})\n\n${input.content}`,
      });

      posthog()?.capture({
        event: "feedback_send",
        distinctId: ctx.user.id,
      });
    }),
});
