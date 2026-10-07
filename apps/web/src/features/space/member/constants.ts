import type { MemberContentSummary } from "./types";

export const emptyMemberContentSummary: MemberContentSummary = {
  active: { polls: 0, events: 0, eventTypes: 0, sheets: 0 },
  finished: { polls: 0, events: 0 },
  activeEventsWithVideoCall: 0,
};
