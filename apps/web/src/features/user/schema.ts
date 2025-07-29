import type { TimeFormat } from "@prisma/client";
import z from "zod";

export const userRoleSchema = z.enum(["admin", "user"]);

export type UserRole = z.infer<typeof userRoleSchema>;

export type UserDTO = {
  id: string;
  name: string;
  image?: string;
  email: string;
  role: UserRole;
  isGuest: boolean;
  timeZone?: string;
  timeFormat?: TimeFormat;
  locale?: string;
  weekStart?: number;
  customerId?: string;
};
