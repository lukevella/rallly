import type { PureAbility } from "@casl/ability";
import { AbilityBuilder } from "@casl/ability";
import {
  type PrismaQuery,
  type Subjects,
  createPrismaAbility,
} from "@casl/prisma";
import type {
  Comment,
  Participant,
  Poll,
  ScheduledEvent,
  Space,
  SpaceMember,
  Subscription,
  UserRole,
} from "@prisma/client";

export type User = {
  id: string;
  name: string;
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
      ScheduledEvent: ScheduledEvent;
    }>
  | "ControlPanel";

export type AppAbility = PureAbility<[string, Subject], PrismaQuery>;

export const defineAbilityFor = (
  user?: User,
  options?: {
    isInitialAdmin?: boolean;
  },
) => {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createPrismaAbility,
  );

  if (!user) {
    return build();
  }

  if (user.role === "admin") {
    can("access", "ControlPanel");
    can("update", "User", ["role"]);
    cannot("update", "User", ["role"], { id: user.id });
    can("delete", "User");
  }

  if (user.role === "user") {
    if (options?.isInitialAdmin) {
      can("update", "User", ["role"], {
        id: user.id,
      });
    }

    can("delete", "User", {
      id: user.id,
    });
  }

  can("update", "User", ["email", "name"], { id: user.id });
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

  can("update", "ScheduledEvent", { userId: user.id });

  return build();
};
