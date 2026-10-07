import * as z from "zod";
import { pollConferencingSchema } from "@/features/conferencing/schema";

/** Why a poll closed: the organizer, or every option having passed. */
export const pollClosedReasonSchema = z.enum(["auto", "manual"]);

export type PollClosedReason = z.infer<typeof pollClosedReasonSchema>;

/**
 * Poll activity vocabulary v1. The `type` column is a plain string in the
 * database so the vocabulary grows by extending this union, without a
 * migration. Subject ids are soft references that outlive their subjects;
 * payloads carry the display snapshot (names, dates) so an event still
 * renders after the participant, option or account it refers to is gone.
 *
 * Invite events are defined ahead of their write sites: email invites ship in
 * phase 2, and defining the vocabulary now keeps it in one place.
 */

const actor = {
  /** The acting user. Null for system events (e.g. the auto-close cron). */
  userId: z.string().nullish(),
};

const optionSnapshotSchema = z.object({
  start: z.iso.datetime(),
  duration: z.number().int().nonnegative(),
});

const voteSnapshotSchema = z.object({
  optionId: z.string(),
  start: z.iso.datetime(),
  duration: z.number().int().nonnegative(),
  type: z.enum(["yes", "no", "ifNeedBe"]),
});

// One event per edit rather than per date, so replacing a poll's dates reads
// as one change in the timeline.
const optionsSnapshotSchema = z.object({
  options: z
    .array(optionSnapshotSchema.extend({ optionId: z.string() }))
    .min(1),
  // The zone the dates were stored in (null when floating). A time zone edit
  // re-stores every date, so the poll's current zone can't render the old
  // ones. Absent on entries written before it was recorded.
  timeZone: z.string().nullable().optional(),
});

const changeActionSchema = z.enum(["added", "changed", "removed"]);

/**
 * One field a poll_updated edit touched, with the value it had before. The
 * current value lives on the poll, so only the old one is snapshotted.
 */
export const pollChangeSchema = z.discriminatedUnion("field", [
  z.object({ field: z.literal("title"), from: z.string() }),
  z.object({
    field: z.literal("description"),
    action: changeActionSchema,
    from: z.string().nullable(),
  }),
  z.object({
    field: z.literal("location"),
    action: changeActionSchema,
    from: z.string().nullable(),
  }),
  z.object({
    field: z.literal("conferencing"),
    action: changeActionSchema,
    from: pollConferencingSchema.nullable(),
  }),
  z.object({ field: z.literal("timeZone"), from: z.string().nullable() }),
  z.object({ field: z.literal("hideParticipants"), from: z.boolean() }),
  z.object({ field: z.literal("hideScores"), from: z.boolean() }),
  z.object({ field: z.literal("disableComments"), from: z.boolean() }),
  z.object({ field: z.literal("allowTentativeVotes"), from: z.boolean() }),
  z.object({ field: z.literal("requireParticipantEmail"), from: z.boolean() }),
  // Written before settings changes were itemized. Still read for that history.
  z.object({ field: z.literal("settings") }),
]);

export type PollChange = z.infer<typeof pollChangeSchema>;

/** A user as they were named when the event happened. */
const userSnapshotSchema = z.object({ id: z.string(), name: z.string() });

/** Why a poll changed hands: its organizer was removed from the space. */
export const pollOrganizerChangedReasonSchema = z.enum(["member_removed"]);

const inviteePayloadSchema = z.object({
  email: z.string(),
});

export const pollActivitySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("poll_created"),
    ...actor,
    payload: z.object({ title: z.string() }),
  }),
  z.object({
    type: z.literal("poll_updated"),
    ...actor,
    // Absent on entries written before changes were itemized.
    payload: z.object({ changes: z.array(pollChangeSchema).optional() }),
  }),
  z.object({
    type: z.literal("poll_closed"),
    ...actor,
    payload: z.object({ reason: pollClosedReasonSchema }),
  }),
  z.object({
    type: z.literal("poll_reopened"),
    ...actor,
    payload: z.object({}),
  }),
  z.object({
    type: z.literal("poll_deleted"),
    ...actor,
    payload: z.object({}),
  }),
  z.object({
    type: z.literal("poll_organizer_changed"),
    ...actor,
    payload: z.object({
      from: userSnapshotSchema,
      to: userSnapshotSchema,
      reason: pollOrganizerChangedReasonSchema,
    }),
  }),
  z.object({
    type: z.literal("poll_scheduled"),
    ...actor,
    // The payload is the scheduled time. The option is optional because a
    // poll can be scheduled for a time that isn't one of its options.
    optionId: z.string().optional(),
    payload: optionSnapshotSchema,
  }),
  z.object({
    type: z.literal("invite_sent"),
    ...actor,
    inviteId: z.string(),
    payload: inviteePayloadSchema,
  }),
  z.object({
    // Opening is the invitee's own act, and invitees are not users.
    type: z.literal("invite_opened"),
    inviteId: z.string(),
    payload: inviteePayloadSchema,
  }),
  z.object({
    type: z.literal("invite_reminded"),
    ...actor,
    inviteId: z.string(),
    payload: inviteePayloadSchema,
  }),
  z.object({
    type: z.literal("invite_revoked"),
    ...actor,
    inviteId: z.string(),
    payload: inviteePayloadSchema,
  }),
  z.object({
    type: z.literal("invites_revoked_bulk"),
    ...actor,
    payload: z.object({ count: z.number().int().positive() }),
  }),
  z.object({
    type: z.literal("response_created"),
    ...actor,
    participantId: z.string(),
    // A response's note is set once, when it's created, so the snapshot
    // stays accurate. Rows written before the note was recorded lack it.
    payload: z.object({ name: z.string(), note: z.string().optional() }),
  }),
  z.object({
    type: z.literal("response_updated"),
    ...actor,
    participantId: z.string(),
    payload: z.object({ name: z.string() }),
  }),
  z.object({
    type: z.literal("response_deleted"),
    ...actor,
    participantId: z.string(),
    payload: z.object({
      name: z.string(),
      votes: z.array(voteSnapshotSchema),
    }),
  }),
  z.object({
    type: z.literal("options_added"),
    ...actor,
    payload: optionsSnapshotSchema,
  }),
  z.object({
    type: z.literal("options_deleted"),
    ...actor,
    payload: optionsSnapshotSchema,
  }),
  // One event per date, written before edits were batched into
  // options_added and options_deleted. Still read for that history.
  z.object({
    type: z.literal("option_added"),
    ...actor,
    optionId: z.string(),
    payload: optionSnapshotSchema,
  }),
  z.object({
    type: z.literal("option_deleted"),
    ...actor,
    optionId: z.string(),
    payload: optionSnapshotSchema,
  }),
]);

export type PollActivityEvent = z.infer<typeof pollActivitySchema>;

export type PollActivityType = PollActivityEvent["type"];

/**
 * Rehydrates a stored activity row into a typed event. Returns null for rows
 * this version of the vocabulary can't interpret (e.g. a type written by a
 * newer deploy) so readers skip them instead of failing the whole feed.
 */
export function parsePollActivity(row: {
  type: string;
  userId: string | null;
  participantId: string | null;
  inviteId: string | null;
  optionId: string | null;
  payload: unknown;
}) {
  const result = pollActivitySchema.safeParse({
    type: row.type,
    userId: row.userId,
    participantId: row.participantId ?? undefined,
    inviteId: row.inviteId ?? undefined,
    optionId: row.optionId ?? undefined,
    payload: row.payload,
  });

  return result.success ? result.data : null;
}
