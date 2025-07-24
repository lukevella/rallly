import type { PureAbility } from "@casl/ability";
import { AbilityBuilder } from "@casl/ability";
import type { PrismaQuery, Subjects } from "@casl/prisma";
import { createPrismaAbility } from "@casl/prisma";
import type {
  ScheduledEvent,
  SpaceMember,
  SpaceMemberInvite,
} from "@rallly/database";
import type { MemberRole } from "@/features/space/schema";

export type MemberAbilityContext = {
  userId: string;
  spaceId: string;
  role: MemberRole;
};

type Action = "cancel" | "create" | "read" | "update" | "delete";
type Subject = Subjects<{
  ScheduledEvent: ScheduledEvent;
  SpaceMember: SpaceMember;
  SpaceMemberInvite: SpaceMemberInvite;
}>;

export type MemberAbility = PureAbility<[Action, Subject], PrismaQuery>;

export function defineAbilityForMember(member: MemberAbilityContext) {
  const builder = new AbilityBuilder<MemberAbility>(createPrismaAbility);

  switch (member.role) {
    case "admin":
      defineSpaceAdminRules(builder, member);
      break;
    case "member":
      defineSpaceMemberRules(builder, member);
      break;
  }

  return builder.build();
}

function defineSpaceMemberRules(
  builder: AbilityBuilder<MemberAbility>,
  member: MemberAbilityContext,
) {
  const { can } = builder;

  can("cancel", "ScheduledEvent", {
    spaceId: member.spaceId,
    userId: member.userId,
  });
}

function defineSpaceAdminRules(
  builder: AbilityBuilder<MemberAbility>,
  member: MemberAbilityContext,
) {
  const { can, cannot } = builder;

  // Can do everything a member can do
  defineSpaceMemberRules(builder, member);

  can("create", "SpaceMemberInvite", { spaceId: member.spaceId });
  can(["delete"], "SpaceMember", { spaceId: member.spaceId });
  cannot("update", "SpaceMember", ["role"], {
    spaceId: member.spaceId,
    userId: member.userId,
  });
}
