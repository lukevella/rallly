import { isInitialAdmin } from "@/auth/queries";
import { AbilityBuilder, type PureAbility } from "@casl/ability";
import {
  type PrismaQuery,
  type Subjects,
  createPrismaAbility,
} from "@casl/prisma";
import type {
  Comment,
  Participant,
  Poll,
  Space,
  SpaceMember,
  Subscription,
  UserRole,
} from "@prisma/client";

export type User = {
  id: string;
  email: string;
  role: UserRole;
};

export type Action =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage"
  | "finalize"
  | "access";

export type Subject =
  | Subjects<{
      User: User;
      Poll: Poll;
      Space: Space;
      Comment: Comment;
      Participant: Participant;
      SpaceMember: SpaceMember;
      Subscription: Subscription;
    }>
  | "ControlPanel";

export type AppAbility = PureAbility<[string, Subject], PrismaQuery>;

export const defineAbilityFor = ({
  user,
}: {
  user: User | null;
}) => {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createPrismaAbility,
  );

  if (!user) {
    return build();
  }

  can("delete", "User", { id: user.id });

  if (user.role === "admin") {
    can("access", "ControlPanel");
    can("update", "User", ["role"]);
    cannot("update", "User", ["role"], { id: user.id });
  }

  if (user.role === "user") {
    if (isInitialAdmin(user.email)) {
      can("update", "User", ["role"]);
    }
  }
  // Regular user abilities
  can("read", "Poll");
  can("create", "Poll");
  can("update", "Poll", { userId: user.id });
  can("manage", "Poll", { userId: user.id });
  can("delete", "Poll", { userId: user.id });
  can("finalize", "Poll", {
    space: {
      subscription: {
        active: true,
      },
    },
  });

  can("read", "Space", { ownerId: user.id });
  can("read", "Space", {
    members: {
      some: {
        userId: user.id,
      },
    },
  });
  can("create", "Space");
  can("update", "Space", { ownerId: user.id });
  can("delete", "Space", { ownerId: user.id });
  can("manage", "Space", { ownerId: user.id });
  can("manage", "Space", { ownerId: user.id });
  can("manage", "Space", {
    members: {
      some: {
        userId: user.id,
        role: {
          in: ["ADMIN", "OWNER"],
        },
      },
    },
  });

  can("manage", "Subscription", { userId: user.id });
  can("manage", "Subscription", {
    space: {
      members: {
        some: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  can("read", "Comment");
  can("create", "Comment");
  can("update", "Comment", { userId: user.id });
  can("delete", "Comment", { userId: user.id });

  can("read", "Participant");
  can("create", "Participant");
  can("update", "Participant", { userId: user.id });
  can("delete", "Participant", { userId: user.id });

  return build();
};
