import type { PollInviteStatus } from "@/features/poll/invite/utils";

export type PollInviteListItem = {
  id: string;
  email: string;
  status: PollInviteStatus;
};
