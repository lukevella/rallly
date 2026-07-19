import "server-only";

import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { getAccountDeletionCutoff } from "@/features/account-deletion/utils";
import {
  cancelUserSubscriptions,
  deleteStripeCustomer,
} from "@/features/billing/mutations";
import { hardDeleteUser } from "@/features/user/mutations";
import { deletePostHogPerson } from "@/lib/posthog";

const logger = createLogger("account-deletion/mutations");

const REMOVE_DELETED_USERS_BATCH_SIZE = 50;

/**
 * House-keeping reaper: permanently removes accounts whose deletion was
 * scheduled more than the recovery window ago. External stores go first —
 * Stripe (defensive subscription cancel, then the customer object; invoices
 * are lawfully retained by Stripe) and PostHog — so a failure there leaves
 * the user row in place for the next run to retry.
 */
export async function removeDeletedUsers() {
  const cutoff = getAccountDeletionCutoff();
  const failedUserIds: string[] = [];
  let deletedUsers = 0;

  while (true) {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: { lt: cutoff },
        id: { notIn: failedUserIds },
      },
      select: { id: true, email: true, customerId: true },
      take: REMOVE_DELETED_USERS_BATCH_SIZE,
    });

    if (users.length === 0) {
      break;
    }

    for (const user of users) {
      try {
        await cancelUserSubscriptions({ userId: user.id });

        if (user.customerId) {
          await deleteStripeCustomer({ customerId: user.customerId });
        }

        await deletePostHogPerson({ distinctId: user.id });

        await hardDeleteUser({ userId: user.id, email: user.email });

        deletedUsers++;
      } catch (error) {
        logger.error(
          { userId: user.id, error },
          "Failed to remove user scheduled for deletion",
        );
        failedUserIds.push(user.id);
      }
    }
  }

  return deletedUsers;
}
