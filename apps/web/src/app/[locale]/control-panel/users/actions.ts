"use server";

import { subject } from "@casl/ability";
import { refresh } from "next/cache";
import * as z from "zod";
import {
  cancelUserSubscriptions,
  deleteStripeCustomer,
} from "@/features/billing/mutations";
import { banUserForAbuse } from "@/features/moderation/mutations";
import { getUser, getUserDeletionDetails } from "@/features/user/data";
import { hardDeleteUser } from "@/features/user/mutations";
import { AppError } from "@/lib/errors/app-error";
import { deletePostHogPerson } from "@/lib/posthog";
import { adminActionClient } from "@/lib/safe-action/server";

// Route-private because deleting a user spans features: the app layer may
// import user and billing together, the user feature may not import billing.
export const deleteUserAction = adminActionClient
  .metadata({ actionName: "delete_user" })
  .inputSchema(
    z.object({
      userId: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const userId = parsedInput.userId;

    const user = await getUserDeletionDetails(userId);

    if (!user) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    if (user.hasActiveSubscription) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "User has active subscriptions",
      });
    }

    // Same external-store cleanup as the account deletion reaper so Stripe
    // and PostHog records don't outlive the account.
    await cancelUserSubscriptions({ userId });

    if (user.customerId) {
      await deleteStripeCustomer({ customerId: user.customerId });
    }

    await deletePostHogPerson({ distinctId: userId });

    await hardDeleteUser({ userId });

    refresh();

    return {
      success: true,
    };
  });

// Route-private for the same reason: a ban cancels the user's subscriptions,
// through the moderation feature's ban step.
export const banUserAction = adminActionClient
  .metadata({ actionName: "ban_user" })
  .inputSchema(
    z.object({
      userId: z.string(),
      reason: z.string().trim().max(500).optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { userId, reason } = parsedInput;

    const targetUser = await getUser(userId);

    if (!targetUser) {
      throw new AppError({
        code: "NOT_FOUND",
        message: `User ${userId} not found`,
      });
    }

    if (targetUser.banned) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "User is already banned",
      });
    }

    if (ctx.ability.cannot("update", subject("User", targetUser), "banned")) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "Current user is not authorized to ban this user",
      });
    }

    await banUserForAbuse({
      userId,
      reason: reason || "Banned from the control panel",
    });

    refresh();
  });
