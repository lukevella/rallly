import "server-only";

import { prisma } from "@rallly/database";
import { syncSpaceTier } from "@/features/billing/mutations";
import { getTrialEndDate } from "@/features/billing/trial/utils";

export type TrialRefusalReason =
  | "space_not_found"
  | "trial_already_used"
  | "subscription_active"
  | "already_pro";

export type StartTrialResult =
  | { started: true; endsAt: Date }
  | { started: false; reason: TrialRefusalReason };

/**
 * Starts the space's free trial: pro for 14 days, no card, once per space.
 * Eligible only while the space is hobby, has never started a trial and has
 * no active subscription (the same reading of the subscription rows as the
 * webhook's tier sync).
 */
export async function startSpaceTrial({
  spaceId,
  now = new Date(),
}: {
  spaceId: string;
  now?: Date;
}): Promise<StartTrialResult> {
  const endsAt = getTrialEndDate(now);

  return prisma.$transaction(async (tx) => {
    const space = await tx.space.findUnique({
      where: { id: spaceId },
      select: {
        tier: true,
        trialStartedAt: true,
        subscriptions: {
          where: { active: true },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!space) {
      return { started: false, reason: "space_not_found" };
    }

    if (space.trialStartedAt) {
      return { started: false, reason: "trial_already_used" };
    }

    if (space.subscriptions.length > 0) {
      return { started: false, reason: "subscription_active" };
    }

    if (space.tier !== "hobby") {
      return { started: false, reason: "already_pro" };
    }

    // Conditional on the row still being eligible, so of two presses that
    // both got past the reads above, the database lets exactly one write.
    const { count } = await tx.space.updateMany({
      where: { id: spaceId, tier: "hobby", trialStartedAt: null },
      data: { tier: "pro", trialStartedAt: now, trialEndsAt: endsAt },
    });

    if (count === 0) {
      return { started: false, reason: "trial_already_used" };
    }

    return { started: true, endsAt };
  });
}

/**
 * Downgrades every space whose trial has ended and that has no active
 * subscription. A space that bought Pro during its trial is left alone.
 * Returns the ids of the spaces that went back to hobby.
 */
export async function endExpiredTrials({
  now = new Date(),
}: {
  now?: Date;
} = {}) {
  const candidates = await prisma.space.findMany({
    where: {
      tier: "pro",
      trialEndsAt: { lte: now },
      subscriptions: { none: { active: true } },
    },
    select: { id: true },
  });

  const ended: string[] = [];

  for (const { id } of candidates) {
    // Re-decided inside the transaction: a subscription may have arrived
    // since the query above.
    const tier = await prisma.$transaction((tx) => syncSpaceTier(tx, id, now));

    if (tier === "hobby") {
      ended.push(id);
    }
  }

  return ended;
}
