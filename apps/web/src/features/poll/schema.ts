import * as z from "zod";

// Descriptions are Markdown pushed raw into the iCal DESCRIPTION. RFC 5545 sets
// no length limit; the binding constraint is Google Calendar, which caps the
// DESCRIPTION around 8192 chars. 8000 sits just under that and covers every
// existing poll — including long institutional event invites — so no real
// content is rejected.
export const MAX_POLL_DESCRIPTION_LENGTH = 8000;

export const pollStatusSchema = z.enum([
  "open",
  "closed",
  "scheduled",
  "canceled",
]);

export type PollStatus = z.infer<typeof pollStatusSchema>;

export const pollClosedReasonSchema = z.enum(["auto", "manual"]);

export type PollClosedReason = z.infer<typeof pollClosedReasonSchema>;
