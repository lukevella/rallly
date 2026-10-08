import { TRIAL_LENGTH_DAYS } from "@/features/billing/trial/constants";

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
