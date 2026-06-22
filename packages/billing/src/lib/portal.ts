/**
 * Identity markers for the seat-update billing portal configuration. Shared
 * between the seat-update flow (apps/web/src/features/billing/portal.ts), which
 * creates and reuses the configuration, and the cleanup script
 * (scripts/cleanup-portal-configurations.ts), which deactivates stale ones.
 *
 * Bump SEAT_UPDATE_PORTAL_VERSION whenever the configuration shape changes: a new
 * configuration is created on next use and the cleanup script retires the
 * previous-version ones.
 */
export const SEAT_UPDATE_PORTAL_HEADLINE = "Update your seat allocation";
export const SEAT_UPDATE_PORTAL_PURPOSE = "seat_update";
export const SEAT_UPDATE_PORTAL_VERSION = "1";
