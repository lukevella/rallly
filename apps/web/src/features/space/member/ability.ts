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
  user: { id: string };
  space: { id: string; role: MemberRole };
};

type Action = "cancel" | "create" | "read" | "update" | "delete";
type Subject = Subjects<{
  ScheduledEvent: ScheduledEvent;
  SpaceMember: SpaceMember;
  SpaceMemberInvite: SpaceMemberInvite;
  Subscription: {
    spaceId: string;
  };
}>;

export type MemberAbility = PureAbility<[Action, Subject], PrismaQuery>;

export function defineAbilityForMember(ctx: MemberAbilityContext) {
  const builder = new AbilityBuilder<MemberAbility>(createPrismaAbility);

  switch (ctx.space.role) {
    case "admin":
      defineSpaceAdminRules(builder, ctx);
      break;
    case "member":
      defineSpaceMemberRules(builder, ctx);
      break;
  }

  return builder.build();
}

function defineSpaceMemberRules(
  builder: AbilityBuilder<MemberAbility>,
  { user, space }: MemberAbilityContext,
) {
  const { can } = builder;

  can("cancel", "ScheduledEvent", {
    spaceId: space.id,
    userId: user.id,
  });
}

function defineSpaceAdminRules(
  builder: AbilityBuilder<MemberAbility>,
  ctx: MemberAbilityContext,
) {
  const { can, cannot } = builder;

  // Can do everything a member can do
  defineSpaceMemberRules(builder, ctx);

  can("create", "SpaceMemberInvite", { spaceId: ctx.space.id });
  can(["delete"], "SpaceMember", { spaceId: ctx.space.id });
  cannot("update", "SpaceMember", ["role"], {
    spaceId: ctx.space.id,
    userId: ctx.user.id,
  });
  can("read", "Subscription", {
    spaceId: ctx.space.id,
  });
}
