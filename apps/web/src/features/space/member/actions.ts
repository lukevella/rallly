"use server";

import { subject } from "@casl/ability";
import { defineAbilityForSpace } from "@/features/space/ability";
import { getActiveSpaceForUser, getMember } from "@/features/space/data";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { getInvite } from "@/features/space/member/data";
import {
  acceptInvite,
  cancelInvite,
  changeMemberRole,
  inviteMember,
  removeMember,
} from "@/features/space/member/mutations";
import {
  acceptInviteSchema,
  cancelInviteSchema,
  changeMemberRoleSchema,
  inviteMemberSchema,
  removeMemberSchema,
} from "@/features/space/member/schema";
import { AppError } from "@/lib/errors/app-error";
import { track } from "@/lib/posthog";
import { authActionClient } from "@/lib/safe-action/server";

async function requireActiveSpace(user: { id: string }) {
  const space = await getActiveSpaceForUser(user.id);

  if (!space) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "No active space found",
    });
  }

  return space;
}

export const inviteMemberAction = authActionClient
  .metadata({ actionName: "invite_member" })
  .inputSchema(inviteMemberSchema)
  .action(async ({ ctx, parsedInput }) => {
    const space = await requireActiveSpace(ctx.user);

    if (defineAbilityForSpace(space).cannot("invite", "Member")) {
      throw new AppError({
        code: "PAYMENT_REQUIRED",
        message: "You need a Pro subscription to invite members to this space",
      });
    }

    const ability = defineAbilityForMember({ user: ctx.user, space });

    if (ability.cannot("create", "SpaceMemberInvite")) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have permission to invite members to this space",
      });
    }

    const result = await inviteMember({
      spaceId: space.id,
      spaceName: space.name,
      email: parsedInput.email,
      role: parsedInput.role,
      inviter: {
        id: ctx.user.id,
        name: ctx.user.name,
        locale: ctx.user.locale,
      },
    });

    if (result.ok && result.code === "INVITE_SENT") {
      track(ctx.user, {
        event: "space_member_invite",
        properties: {
          role: parsedInput.role,
        },
        groups: {
          space: space.id,
        },
      });
    }

    return result;
  });

export const acceptInviteAction = authActionClient
  .metadata({ actionName: "accept_invite" })
  .inputSchema(acceptInviteSchema)
  .action(async ({ ctx, parsedInput }) => {
    // Authorized by the invite row matching the signed-in user's email,
    // not by space membership — resolved inside the mutation.
    const result = await acceptInvite({
      spaceId: parsedInput.spaceId,
      user: { id: ctx.user.id, email: ctx.user.email },
    });

    if (result.ok) {
      track(ctx.user, {
        event: "space_member_join",
        properties: {
          member_count: result.memberCount,
        },
        groups: {
          space: parsedInput.spaceId,
        },
      });
    }

    return result;
  });

export const cancelInviteAction = authActionClient
  .metadata({ actionName: "cancel_invite" })
  .inputSchema(cancelInviteSchema)
  .action(async ({ ctx, parsedInput }) => {
    const space = await requireActiveSpace(ctx.user);

    const invite = await getInvite(parsedInput.inviteId);

    if (!invite) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Invite not found",
      });
    }

    if (invite.spaceId !== space.id) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have access to this invite",
      });
    }

    const ability = defineAbilityForMember({ user: ctx.user, space });

    if (ability.cannot("delete", "SpaceMemberInvite")) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have permission to cancel invites",
      });
    }

    await cancelInvite({ inviteId: parsedInput.inviteId });
  });

export const removeMemberAction = authActionClient
  .metadata({ actionName: "remove_member" })
  .inputSchema(removeMemberSchema)
  .action(async ({ ctx, parsedInput }) => {
    const space = await requireActiveSpace(ctx.user);

    const member = await getMember(parsedInput.memberId);

    if (!member) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Member not found",
      });
    }

    const ability = defineAbilityForMember({ user: ctx.user, space });

    if (ability.cannot("delete", subject("SpaceMember", member))) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You do not have permission to remove members from this space",
      });
    }

    const { removedUserId, memberCount } = await removeMember({
      memberId: parsedInput.memberId,
    });

    track(ctx.user, {
      event: "space_member_remove",
      properties: {
        member_count: memberCount,
        deleted_member_user_id: removedUserId,
      },
      groups: {
        space: member.spaceId,
      },
    });
  });

export const changeMemberRoleAction = authActionClient
  .metadata({ actionName: "change_member_role" })
  .inputSchema(changeMemberRoleSchema)
  .action(async ({ ctx, parsedInput }) => {
    const space = await requireActiveSpace(ctx.user);

    const member = await getMember(parsedInput.memberId);

    if (!member) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Member not found",
      });
    }

    const ability = defineAbilityForMember({ user: ctx.user, space });

    if (ability.cannot("update", subject("SpaceMember", member))) {
      throw new AppError({
        code: "FORBIDDEN",
        message:
          "You do not have permission to change member roles in this space",
      });
    }

    await changeMemberRole({
      memberId: parsedInput.memberId,
      role: parsedInput.role,
    });
  });
