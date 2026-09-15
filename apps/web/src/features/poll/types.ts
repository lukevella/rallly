import type { VoteType } from "@/features/poll/constants";
import type { PollClosedReason, PollStatus } from "@/features/poll/schema";
import type { SpaceTier } from "@/features/space/schema";

export type PollUnavailableReason = "deleted" | "removed";

export type PollDetails = {
  id: string;
  title: string;
  location: string | null;
  description: string | null;
  createdAt: Date;
  status: PollStatus;
  closedReason: PollClosedReason | null;
  hideParticipants: boolean;
  disableComments: boolean;
  allowTentativeVotes: boolean;
  hideScores: boolean;
  requireParticipantEmail: boolean;
  muted: boolean;
  timeZone: string | null;
  userId: string | null;
  spaceId: string | null;
  options: { id: string; startTime: Date; duration: number }[];
  user: { id: string; name: string; image: string | null } | null;
  space: {
    name: string;
    image: string | null;
    tier: SpaceTier;
    showBranding: boolean;
    hideAttribution: boolean;
    primaryColor: string | null;
  } | null;
  event: { id: string; start: Date; duration: number; status: string } | null;
  inviteLink: string;
};

export type Vote = { optionId: string; type: VoteType };

export type PollParticipant = {
  id: string;
  name: string;
  email: string | null;
  userId: string | null;
  note: string | null;
  image: string | null;
  createdAt: Date;
  votes: Vote[];
  /** Identity withheld from this viewer (hidden participants setting). */
  hidden: boolean;
  /** The response's edit link; only the host's list carries it. */
  editUrl: string | null;
};

export type PollComment = {
  id: string;
  content: string;
  authorName: string;
  userId: string | null;
  createdAt: Date;
};
