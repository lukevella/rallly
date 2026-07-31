import * as z from "zod";

// Descriptions are Markdown pushed raw into the iCal DESCRIPTION. RFC 5545 sets
// no length limit; the binding constraint is Google Calendar, which caps the
// DESCRIPTION around 8192 chars. 8000 sits just under that and covers every
// existing poll — including long institutional event invites — so no real
// content is rejected.
export const MAX_POLL_DESCRIPTION_LENGTH = 8000;

// Comment content ships in the new-comment notification email, so it must be
// bounded. Prod p90 is ~200 chars; legitimate long comments reach ~2000.
export const MAX_COMMENT_LENGTH = 2000;

// Flows into the email subject line.
export const MAX_COMMENT_AUTHOR_NAME_LENGTH = 100;

// Response notes ship in the new-participant notification email, so they must
// be bounded. A note is short context alongside a response, not discussion.
export const MAX_RESPONSE_NOTE_LENGTH = 500;

export const pollStatusSchema = z.enum([
  "open",
  "closed",
  "scheduled",
  "canceled",
]);

export type PollStatus = z.infer<typeof pollStatusSchema>;

export const pollClosedReasonSchema = z.enum(["auto", "manual"]);

export type PollClosedReason = z.infer<typeof pollClosedReasonSchema>;

export const setPollMutedSchema = z.object({
  pollId: z.string(),
  muted: z.boolean(),
});
