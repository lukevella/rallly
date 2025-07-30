import type { PureAbility } from "@casl/ability";
import { AbilityBuilder } from "@casl/ability";
import type { PrismaQuery, Subjects } from "@casl/prisma";
import { createPrismaAbility } from "@casl/prisma";
import type { MemberDTO } from "@/features/space/member/types";
import type { MemberRole } from "@/features/space/schema";

export type MemberAbilityContext = {
  user: { id: string };
  space: { id: string; role: MemberRole };
};

type Action = "cancel" | "create" | "read" | "update" | "delete";
type Subject = Subjects<{
  ScheduledEvent: {
    spaceId: string;
    userId: string;
  };
  SpaceMember: MemberDTO;
  SpaceMemberInvite: {
    spaceId: string;
  };
  Subscription: {
    spaceId: string;
  };
}>;

export type MemberAbility = PureAbility<[Action, Subject], PrismaQuery>;

export function defineAbilityForMember(ctx?: MemberAbilityContext) {
  const builder = new AbilityBuilder<MemberAbility>(createPrismaAbility);

  if (!ctx) {
    return builder.build();
  }

  switch (ctx.space.role) {
    case "admin":
      defineSpaceAdminRules(builder, ctx);
      break;
    default:
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

  can("read", "Subscription", {
    spaceId: ctx.space.id,
  });
  can("create", "SpaceMemberInvite");
  can("delete", "SpaceMember", { spaceId: ctx.space.id });
  cannot(["delete", "update"], "SpaceMember", {
    userId: ctx.user.id,
  });
}
