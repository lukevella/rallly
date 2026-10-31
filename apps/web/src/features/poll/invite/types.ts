import type { PollInviteStatus } from "@/features/poll/invite/utils";

export type PollInviteListItem = {
  id: string;
  email: string;
  status: PollInviteStatus;
  inviteUrl: string;
  /** The response the invite became, once the invitee has responded */
  participantId: string | null;
};
