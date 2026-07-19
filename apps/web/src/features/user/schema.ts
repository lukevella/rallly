import type { TimeFormat } from "@rallly/database";
import * as z from "zod";

export const userRoleSchema = z.enum(["admin", "user"]);

export type UserRole = z.infer<typeof userRoleSchema>;

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
