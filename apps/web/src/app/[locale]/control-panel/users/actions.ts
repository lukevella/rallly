"use server";
import * as z from "zod";
import {
  cancelUserSubscriptions,
  deleteStripeCustomer,
} from "@/features/billing/mutations";
import { getUserDeletionDetails } from "@/features/user/data";
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

    await hardDeleteUser({ userId, email: user.email });

    return {
      success: true,
    };
  });
