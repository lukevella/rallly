import * as z from "zod";

// Descriptions are Markdown pushed raw into the iCal DESCRIPTION. RFC 5545 sets
// no length limit; the binding constraint is Google Calendar, which caps the
// DESCRIPTION around 8192 chars. 8000 sits just under that and covers every
// existing poll — including long institutional event invites — so no real
// content is rejected.
export const MAX_POLL_TITLE_LENGTH = 255;

// A location poll lists the places people vote between. The count is capped so
// the vote grid stays readable and the poll page stays light.
export const MAX_POLL_PLACES = 20;
export const MAX_PLACE_NAME_LENGTH = 120;
export const MAX_PLACE_ADDRESS_LENGTH = 255;
export const MAX_PLACE_URL_LENGTH = 2048;
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

// Defined with the activity vocabulary, which records the reason; kept
// reachable from the poll schema for its other readers.
export {
  type PollClosedReason,
  pollClosedReasonSchema,
} from "@/features/activity/schema";

export const setPollMutedSchema = z.object({
  pollId: z.string(),
  muted: z.boolean(),
});

const httpUrlSchema = z
  .string()
  .trim()
  .max(MAX_PLACE_URL_LENGTH)
  .refine((value) => {
    try {
      const { protocol } = new URL(value);
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  });

/**
 * One place proposed on a location poll. The address and the link are optional
 * and may be empty strings, which is what an untouched form field holds.
 */
export const pollPlaceSchema = z.object({
  name: z.string().trim().min(1).max(MAX_PLACE_NAME_LENGTH),
  address: z
    .string()
    .trim()
    .max(MAX_PLACE_ADDRESS_LENGTH)
    .optional()
    .transform((value) => value || undefined),
  url: httpUrlSchema
    .or(z.literal(""))
    .optional()
    .transform((value) => value || undefined),
});

export type PollPlace = z.infer<typeof pollPlaceSchema>;

export const finalizeLocationPollSchema = z.object({
  pollId: z.string(),
  optionId: z.string(),
});
