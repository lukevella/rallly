import {
  apiPollTierLimits,
  INCLUDED_API_POLLS,
  parseApiPollTier,
} from "@rallly/billing/pricing";
import { API_POLL_NEAR_LIMIT_RATIO } from "./constants";

export function startOfUtcMonth(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function toMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

export function startOfNextUtcMonth(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

export function apiPollTierLimit(value: string | null) {
  const tier = parseApiPollTier(value);
  return tier ? apiPollTierLimits[tier] : null;
}

export function resolveApiPollLimit({
  addonLimit,
  retainedLimit,
  retainedUntil,
  override,
  now,
}: {
  addonLimit: number | null;
  retainedLimit: number | null;
  retainedUntil: Date | null;
  override: number | null;
  now: Date;
}) {
  const retained =
    retainedUntil && retainedUntil > now ? (retainedLimit ?? 0) : 0;

  return Math.max(INCLUDED_API_POLLS, addonLimit ?? 0, retained, override ?? 0);
}

export function getQuotaWarningLevel({
  count,
  limit,
}: {
  count: number;
  limit: number;
}) {
  if (count >= limit) return "at_limit" as const;
  if (count >= limit * API_POLL_NEAR_LIMIT_RATIO) return "near_limit" as const;
  return null;
}
