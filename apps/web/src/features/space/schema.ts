import * as z from "zod";

export const memberRoleSchema = z.enum(["member", "admin"]);
export type MemberRole = z.infer<typeof memberRoleSchema>;

export const spaceTierSchema = z.enum(["hobby", "pro"]);
export type SpaceTier = z.infer<typeof spaceTierSchema>;
