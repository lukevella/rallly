import * as z from "zod";

// Descriptions are Markdown pushed raw into the iCal DESCRIPTION. RFC 5545 sets
// no length limit; real clients do (Google Calendar caps around 8k chars). 2000
// keeps a wide margin while staying generous for a meeting description.
export const MAX_POLL_DESCRIPTION_LENGTH = 2000;

export const pollStatusSchema = z.enum([
  "open",
  "closed",
  "scheduled",
  "canceled",
]);

export type PollStatus = z.infer<typeof pollStatusSchema>;
