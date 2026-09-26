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
  // What happens to the member's live content in the space (open polls,
  // upcoming events, booking pages). Settled content stays put either way.
  content: z.discriminatedUnion("action", [
    z.object({ action: z.literal("transfer"), toMemberId: z.string() }),
  ]),
});

export const changeMemberRoleSchema = z.object({
  memberId: z.string(),
  role: memberRoleSchema,
});

export const acceptInviteSchema = z.object({
  spaceId: z.string(),
});
