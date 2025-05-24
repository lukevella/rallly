import z from "zod";

export const userRoleSchema = z.enum(["admin", "user"]);

export type UserRole = z.infer<typeof userRoleSchema>;
