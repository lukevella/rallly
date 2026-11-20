import { isBillingEnabled } from "@/features/billing/constants";

// Per user, across all their polls, rolling 24h. Per poll caps don't stop
// multi poll spam; this one does.
export const MAX_EMAIL_INVITES_PER_DAY = 100;

// Per paid seat, pooled across the space, per UTC calendar month. Set well
// above legitimate use (the busiest sender so far sent 49 in a month); it
// bounds abuse that stays under the daily cap.
export const EMAIL_INVITES_PER_SEAT_PER_MONTH = 200;

// Usage is always counted; refusing at the limit is switched on separately,
// and only where billing exists because more seats are something to buy.
export const isEmailInviteQuotaEnabled =
  isBillingEnabled && process.env.EMAIL_INVITE_QUOTA_ENABLED === "true";
