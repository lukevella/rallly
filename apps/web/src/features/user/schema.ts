import type { TimeFormat } from "@rallly/database";
import * as z from "zod";

export const userRoleSchema = z.enum(["admin", "user"]);

export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * How long a user must have been inactive to match a filter option. Admins
 * use this to find accounts that can be revoked when someone leaves the
 * organisation, so the options span a notice period upwards.
 */
export const inactivityPeriodSchema = z.enum(["30d", "90d", "180d", "365d"]);

export type InactivityPeriod = z.infer<typeof inactivityPeriodSchema>;

export const INACTIVITY_PERIOD_DAYS: Record<InactivityPeriod, number> = {
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "365d": 365,
};

export const userSortSchema = z.enum(["newest", "leastRecentlyActive"]);

export type UserSort = z.infer<typeof userSortSchema>;

export type UserDTO = {
  id: string;
  name: string;
  image?: string;
  email: string;
  role: UserRole;
  banned: boolean;
  isGuest: boolean;
  timeZone?: string;
  timeFormat?: TimeFormat;
  locale?: string;
  weekStart?: number;
  customerId?: string;
  // Only populated on database-derived DTOs (createUserDTO); deletedAt is
  // deliberately not part of the session user object.
  deletedAt?: Date;
};
