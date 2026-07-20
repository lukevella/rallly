import { prisma } from "@rallly/database";
import * as z from "zod";
import { defaultNotificationPreferences } from "@/features/notifications/constants";
import { getNotificationPreferences } from "@/features/notifications/data";
import { activityEventTypes } from "@/features/notifications/schema";
import { track } from "@/lib/posthog";
import { privateProcedure, router } from "../trpc";

export const user = router({
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

      track(ctx.user, {
        event: "notification_preference_update",
        properties: {
          eventType: input.eventType,
          enabled: input.enabled,
        },
      });
    }),
});
