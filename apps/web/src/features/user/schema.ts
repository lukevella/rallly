import type { TimeFormat } from "@rallly/database";
import * as z from "zod";
import { JOB_TITLE_OTHER_MAX_LENGTH } from "@/features/user/constants";

export const userRoleSchema = z.enum(["admin", "user"]);

export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Either a key from the `jobTitles` picklist or, behind "other", whatever the
 * user typed — one column for both. A free-text answer is a job title like
 * any other, and keeping them together is what lets the values be counted
 * when building a v2 taxonomy. Null clears the answer: consent is the legal
 * basis for holding it, so it has to stay withdrawable.
 */
export const jobTitleSchema = z
  .string()
  .trim()
  .min(1)
  .max(JOB_TITLE_OTHER_MAX_LENGTH);

/**
 * The same rule, plus the null that clears the field. Better-Auth runs a
 * field's validator against every value that isn't `undefined`, so the
 * `jobTitle` additional field has to accept null explicitly or erasing it
 * fails validation — which would leave the answer un-withdrawable and consent
 * unworkable as its legal basis.
 */
export const jobTitleFieldSchema = jobTitleSchema.nullable();

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
