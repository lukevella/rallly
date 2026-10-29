import * as z from "zod";
import { memberRoleSchema } from "@/features/space/schema";

export const inviteMemberSchema = z.object({
  email: z.email(),
  role: memberRoleSchema,
});

export const cancelInviteSchema = z.object({
  inviteId: z.string(),
});

/**
 * What happens to everything the member created in the space: handed to
 * another member (by member id), or deleted.
 */
export const removedMemberContentSchema = z.union([
  z.object({ reassignTo: z.string() }),
  z.object({ delete: z.literal(true) }),
]);

export const removeMemberSchema = z.object({
  memberId: z.string(),
  content: removedMemberContentSchema,
});

export const changeMemberRoleSchema = z.object({
  memberId: z.string(),
  role: memberRoleSchema,
});

export const acceptInviteSchema = z.object({
  spaceId: z.string(),
});
