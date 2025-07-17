import { z } from "zod";

export const spaceMemberRoleSchema = z.enum(["member", "admin", "owner"]);
export type SpaceMemberRole = z.infer<typeof spaceMemberRoleSchema>;
