import type { PureAbility } from "@casl/ability";
import { AbilityBuilder } from "@casl/ability";
import type { PrismaQuery, Subjects } from "@casl/prisma";
import { createPrismaAbility } from "@casl/prisma";
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

export type UserContext = {
  id: string;
  email: string;
  role: UserRole;
};

type SpaceTier = "hobby" | "pro";
type SpaceRole = "member" | "owner" | "admin";

type SpaceContext = {
  id: string;
  role: SpaceRole;
  tier: SpaceTier;
};

export type AppContext = {
  space?: SpaceContext;
};

export type Action =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage"
  | "finalize"
  | "access"
  | "cancel"
  | "invite";

export type Subject =
  | Subjects<{
      User: UserContext;
      Poll: Poll;
      Space: Space;
      Comment: Comment;
      Participant: Participant;
      SpaceMember: SpaceMember;
      Subscription: Subscription;
      ScheduledEvent: ScheduledEvent;
    }>
  | "ControlPanel"
  | "all";

export type AppAbility = PureAbility<[Action, Subject], PrismaQuery>;

// Main ability definition function following RBAC pattern
export function defineAbilityFor(user?: UserContext, context?: AppContext) {
  return createPrismaAbility<AppAbility>(defineRulesFor(user, context));
}

// Rule definition function that delegates to specific role handlers
export function defineRulesFor(user?: UserContext, context?: AppContext) {
  const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);

  if (!user) {
    return builder.rules;
  }

  // Add authenticated user rules
  defineAuthenticatedUserRules(builder, user);

  // Add system role-based rules
  switch (user.role) {
    case "admin":
      defineAdminRules(builder, user);
      break;
    case "user":
      defineUserRules(builder, user);
      break;
  }

  // Add context-specific rules
  if (context?.space) {
    defineSpaceRules(builder, user, context.space);
  }

  return builder.rules;
}

// Base authenticated user rules
function defineAuthenticatedUserRules(
  { can, cannot }: AbilityBuilder<AppAbility>,
  user: UserContext,
) {
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

  // Event management
  can("cancel", "ScheduledEvent", { userId: user.id });

  // Basic space access
  can("read", "Space", { ownerId: user.id });
  can("read", "Space", {
    members: {
      some: {
        userId: user.id,
      },
    },
  });
}

function defineAdminRules(
  { can, cannot }: AbilityBuilder<AppAbility>,
  user: UserContext,
) {
  // System administration
  can("access", "ControlPanel");
  can("update", "User", ["role"]);
  cannot("update", "User", ["role"], { id: user.id });
  can("delete", "User");
}

function defineUserRules(
  { can }: AbilityBuilder<AppAbility>,
  user: UserContext,
) {
  // Initial admin setup
  if (user.email === process.env.INITIAL_ADMIN_EMAIL) {
    can("update", "User", ["role"], { id: user.id });
  }
}

function defineSpaceRules(
  { can, cannot }: AbilityBuilder<AppAbility>,
  user: UserContext,
  spaceContext: SpaceContext,
) {
  const { role, tier, id: spaceId } = spaceContext;

  // All members can read space content
  can("read", "Poll", { spaceId });
  can("read", "Comment", {
    poll: { spaceId },
  });
  can("read", "SpaceMember", { spaceId });

  // Owner and Admin permissions
  if (role === "owner" || role === "admin") {
    can(["update", "delete"], "SpaceMember", { spaceId });
    can("update", "SpaceMember", ["role"], { spaceId });
    // Cannot update their own role
    cannot("update", "SpaceMember", ["role"], {
      spaceId,
      userId: user.id,
    });
  }

  can("cancel", "ScheduledEvent", {
    spaceId,
  });

  // Tier-based permissions
  switch (tier) {
    case "hobby":
      cannot("update", "Poll", [
        "requireParticipantEmail",
        "hideScores",
        "hideParticipants",
      ]);
      cannot("invite", "SpaceMember", { spaceId });
      break;
    case "pro":
      can("invite", "SpaceMember", { spaceId });
      break;
  }
}
