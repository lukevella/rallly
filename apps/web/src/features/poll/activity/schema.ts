import * as z from "zod";
import { pollClosedReasonSchema } from "@/features/poll/schema";

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
    payload: z.object({}),
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
    type: z.literal("poll_scheduled"),
    ...actor,
    optionId: z.string(),
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
    payload: z.object({ name: z.string() }),
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
