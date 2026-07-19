import type { Prisma } from "@rallly/database";
import { isSelfHosted } from "@/lib/constants";

/**
 * Membership in a hobby space is only effective for the space owner, so a
 * downgraded space locks out its other members until it is upgraded again.
 * Apply to every user-scoped membership resolution query. Self-hosted
 * instances are exempt: all their spaces are treated as pro regardless of
 * the tier stored in the database.
 */
export function effectiveSpaceMemberWhere({
  userId,
}: {
  userId: string;
}): Prisma.SpaceMemberWhereInput {
  if (isSelfHosted) {
    return { userId };
  }

  return {
    userId,
    OR: [{ space: { tier: "pro" } }, { space: { ownerId: userId } }],
  };
}
