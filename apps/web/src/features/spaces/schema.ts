import { z } from "zod";

export const spaceMemberRoleSchema = z.enum(["member", "admin"]);
export type SpaceMemberRole = z.infer<typeof spaceMemberRoleSchema>;
