// Recipients one poll owner may cause Rallly to email in a window, across
// every send made on their behalf. The median scheduled poll emails 4
// participants and 99% of polls have under 24 responses, so a real host
// never gets near this; a host spraying addresses stops at it.
export const EMAIL_BUDGET_RECIPIENTS_PER_DAY = 200;
export const EMAIL_BUDGET_WINDOW = "24 h";

export const EMAIL_BUDGET_KINDS = [
  "participant_confirmation",
  "scheduled_event_invite",
] as const;
