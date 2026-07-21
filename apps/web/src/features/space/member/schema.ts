import * as z from "zod";
import { memberRoleSchema } from "@/features/space/schema";

export const inviteMemberSchema = z.object({
  email: z.email(),
  role: memberRoleSchema,
});

export const cancelInviteSchema = z.object({
  inviteId: z.string(),
});

export const removeMemberSchema = z.object({
  memberId: z.string(),
});

export const changeMemberRoleSchema = z.object({
  memberId: z.string(),
  role: memberRoleSchema,
});

export const acceptInviteSchema = z.object({
  spaceId: z.string(),
});
