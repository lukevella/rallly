import type { InactivityPeriod } from "@/features/user/schema";
import { INACTIVITY_PERIOD_DAYS } from "@/features/user/schema";

/**
 * The instant a user must have been last seen before to count as inactive for
 * the given period. Callers supply `now` so the classification stays bound to
 * the request rather than reading the clock during render.
 */
export function getInactivityCutoff(period: InactivityPeriod, now: Date) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - INACTIVITY_PERIOD_DAYS[period]);
  return cutoff;
}
