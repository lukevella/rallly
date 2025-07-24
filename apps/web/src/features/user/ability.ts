import type { PureAbility } from "@casl/ability";
import { AbilityBuilder } from "@casl/ability";
import type { PrismaQuery, Subjects } from "@casl/prisma";
import { createPrismaAbility } from "@casl/prisma";
import type { Space, User } from "@rallly/database";
import type { UserDTO } from "@/features/user/schema";

type Action = "read" | "update" | "delete";
type Subject = Subjects<{
  User: User;
  Space: Space;
}>;

type UserAbility = PureAbility<[Action, Subject], PrismaQuery>;

export function defineAbilityFor(user?: UserDTO) {
  const builder = new AbilityBuilder<UserAbility>(createPrismaAbility);

  if (!user) {
    return builder.build();
  }

  switch (user.role) {
    case "admin":
      defineAbilityForAdmin(builder, user);
      break;
    case "user":
      defineAbilityForUser(builder, user);
      break;
    default:
      break;
  }

  return builder.build();
}

function defineAbilityForUser(
  builder: AbilityBuilder<UserAbility>,
  user: UserDTO,
) {
  const { can, cannot } = builder;

  // Can update their own email and name
  can("update", "User", ["email", "name"], { id: user.id });
  // Can delete their own account
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

  // Can read their own spaces
  can("read", "Space", { ownerId: user.id });

  // Can read spaces they are a member of
  can("read", "Space", {
    members: {
      some: {
        userId: user.id,
      },
    },
  });
}

function defineAbilityForAdmin(
  builder: AbilityBuilder<UserAbility>,
  user: UserDTO,
) {
  defineAbilityForUser(builder, user);
  const { can, cannot } = builder;
  // Can update any user's role
  can("update", "User", ["role"]);
  // Cannot update their own role
  cannot("update", "User", ["role"], { id: user.id });
  // Can delete any user
  can("delete", "User");
}
