import type { PureAbility } from "@casl/ability";
import type { PrismaQuery, Subjects } from "@casl/prisma";
import type {
  Comment,
  Participant,
  Poll,
  ScheduledEvent,
  Space,
  SpaceMember,
  SpaceMemberInvite,
  Subscription,
  User,
} from "@rallly/database";

export type SpaceTier = "hobby" | "pro";
export type SpaceRole = "admin" | "member";

export type SpaceContext = {
  id: string;
  role: SpaceRole;
  tier: SpaceTier;
};

export type UserRole = "admin" | "user";

export type UserContext = {
  id: string;
  email: string;
  role: UserRole;
};

export type AppContext = {
  space?: SpaceContext;
};

type SpaceAction = "duplicate" | "invite" | "modify" | "finalize";

type CrudAction = "create" | "read" | "update" | "delete";

type EventAction = "reschedule" | "cancel";

export type Action = CrudAction | EventAction | SpaceAction;

type PrismaSubject = Subjects<{
  User: User;
  Poll: Poll;
  Space: Space;
  Comment: Comment;
  Participant: Participant;
  SpaceMember: SpaceMember;
  SpaceMemberInvite: SpaceMemberInvite;
  Subscription: Subscription;
  ScheduledEvent: ScheduledEvent;
}>;

type SpaceSubject = "Poll" | "Member" | "AdvancedPollSettings";

export type Subject = PrismaSubject | SpaceSubject | "all";

export type AppAbility = PureAbility<[Action, Subject], PrismaQuery>;
