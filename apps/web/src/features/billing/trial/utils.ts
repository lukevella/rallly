import { TRIAL_LENGTH_DAYS } from "@/features/billing/trial/constants";
import type { SpaceTier } from "@/features/space/schema";

const DAY_MS = 24 * 60 * 60 * 1000;

// Exact days rather than calendar days, so the length never shifts with the
// server's time zone.
export function getTrialEndDate(startedAt: Date) {
  return new Date(startedAt.getTime() + TRIAL_LENGTH_DAYS * DAY_MS);
}

export function isTrialRunning(
  space: { trialEndsAt: Date | null },
  now = new Date(),
) {
  return space.trialEndsAt !== null && space.trialEndsAt > now;
}

/**
 * Where the space stands with the free trial, as the screen tells it:
 * - eligible: free plan, never had a trial, so the 14 days can be offered
 * - trial: the 14 days are running and nothing is paying for the space
 * - paying: a subscription is active, whatever the trial dates say
 * - ended: the trial was used and its end has passed (the hourly job may
 *   not have run yet, so the stored tier is not consulted)
 * - none: pro without a trial and without a subscription (self-hosted), or
 *   a state the trial has nothing to say about
 */
export type TrialState = "eligible" | "trial" | "paying" | "ended" | "none";

export function getTrialState(
  space: {
    tier: SpaceTier;
    trialStartedAt: Date | null;
    trialEndsAt: Date | null;
    subscriptionActive: boolean;
  },
  now = new Date(),
): TrialState {
  if (space.subscriptionActive) {
    return "paying";
  }
  if (space.trialStartedAt === null) {
    return space.tier === "hobby" ? "eligible" : "none";
  }
  if (isTrialRunning(space, now)) {
    return space.tier === "pro" ? "trial" : "none";
  }
  return "ended";
}

/** Whole days left in the trial, never negative; counts a part day as one. */
export function getTrialDaysLeft(trialEndsAt: Date, now = new Date()) {
  return Math.max(
    0,
    Math.ceil((trialEndsAt.getTime() - now.getTime()) / DAY_MS),
  );
}
