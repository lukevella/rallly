import { AbilityBuilder } from "@casl/ability";
import { createPrismaAbility } from "@casl/prisma";
import type {
  AppAbility,
  AppContext,
  SpaceContext,
  UserContext,
} from "./types";

export function defineAbilityFor(user?: UserContext, context?: AppContext) {
  const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);

  if (!user) {
    return builder.build();
  }

  const { can, cannot } = builder;

  // Profile management
  can("update", "User", ["email", "name"], { id: user.id });
  can("delete", "User", { id: user.id });

  // Cannot delete user if they have active subscriptions
  cannot("delete", "User", {
    spaces: {
      some: {
        subscription: {
          is: {
            active: true,
          },
        },
      },
    },
  });

  // Basic space access
  can("read", "Space", { ownerId: user.id });
  can("read", "Space", {
    members: {
      some: {
        userId: user.id,
      },
    },
  });

  if (user.role === "admin") {
    can("update", "User", ["role"]);
    cannot("update", "User", ["role"], { id: user.id });
    can("delete", "User");
  }

  if (context?.space) {
    switch (context.space.role) {
      case "admin":
        defineSpaceAdminRules(builder, user, context.space);
        break;
      case "member":
        defineSpaceMemberRules(builder, user, context.space);
        break;
    }
  }

  return builder.build();
}

function defineSpaceMemberRules(
  builder: AbilityBuilder<AppAbility>,
  user: UserContext,
  space: SpaceContext,
) {
  const { can } = builder;

  can("cancel", "ScheduledEvent", { spaceId: space.id, userId: user.id });
}

function defineSpaceAdminRules(
  builder: AbilityBuilder<AppAbility>,
  user: UserContext,
  space: SpaceContext,
) {
  const { can, cannot } = builder;

  can("create", "SpaceMemberInvite", { spaceId: space.id });
  can("cancel", "ScheduledEvent", { spaceId: space.id });
  can(["read", "update", "delete"], "SpaceMember", { spaceId: space.id });
  cannot("update", "SpaceMember", ["role"], {
    spaceId: space.id,
    userId: user.id,
  });
}
