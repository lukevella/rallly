import type { MemberRole } from "@/features/space/schema";

export type MemberDTO = {
  id: string;
  name: string;
  email: string;
  userId: string;
  spaceId: string;
  image?: string;
  role: MemberRole;
  isOwner: boolean;
};

export type MemberInviteDTO = {
  id: string;
  email: string;
  spaceId: string;
  role: MemberRole;
  invitedBy: { name: string };
};

/** What a member created in a space, as the remove member dialog shows it. */
export type MemberContentSummary = {
  active: {
    polls: number;
    events: number;
    eventTypes: number;
    sheets: number;
  };
  finished: {
    polls: number;
    events: number;
  };
  /** Active events carrying a video call link minted on the member's account. */
  activeEventsWithVideoCall: number;
};
