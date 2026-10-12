// The same switch the app enforces the limit with, so turning it off reverts
// the copy that describes the limit too. Read at build time: the pages that
// use it are prerendered, so a change needs a redeploy, as it does in the app.
export const isOpenPollLimitEnabled =
  process.env.OPEN_POLL_LIMIT_ENABLED === "true";

// Mirrors FREE_OPEN_POLL_LIMIT in apps/web/src/features/billing/constants.ts
export const FREE_OPEN_POLL_LIMIT = 3;
