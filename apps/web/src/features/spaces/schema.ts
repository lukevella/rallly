import { z } from "zod";

export const spaceMemberRoleSchema = z.enum(["member", "admin"]);
export type SpaceMemberRole = z.infer<typeof spaceMemberRoleSchema>;

export const spaceTierSchema = z.enum(["hobby", "pro"]);
export type SpaceTier = z.infer<typeof spaceTierSchema>;
