import { z } from "zod";

export const memberRoleSchema = z.enum(["member", "admin"]);
export type MemberRole = z.infer<typeof memberRoleSchema>;
