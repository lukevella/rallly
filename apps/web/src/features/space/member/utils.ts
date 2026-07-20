import { isBillingEnabled } from "@/features/billing/constants";

/**
 * Membership in a hobby space is only effective for the space owner, so a
 * downgraded space locks out its other members until it is upgraded again.
 * Apply to every user-scoped membership resolution query. Only enforced
 * when billing is enabled: without an upgrade path there is nothing to
 * gate, and self-hosted spaces are treated as pro regardless of the tier
 * stored in the database.
 */
export function effectiveSpaceMemberWhere({ userId }: { userId: string }) {
  if (!isBillingEnabled) {
    return { userId };
  }

  return {
    userId,
    OR: [{ space: { tier: "pro" as const } }, { space: { ownerId: userId } }],
  };
}
