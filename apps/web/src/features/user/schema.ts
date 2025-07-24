import z from "zod";

export const userRoleSchema = z.enum(["admin", "user"]);

export type UserRole = z.infer<typeof userRoleSchema>;

export type UserDTO = {
  id: string;
  name: string;
  image?: string;
  email: string;
  role: UserRole;
  activeSpaceId?: string;
  timeZone?: string;
  timeFormat?: string;
  locale?: string;
  weekStart?: number;
  customerId?: string;
};
