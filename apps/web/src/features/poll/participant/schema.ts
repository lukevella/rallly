import * as z from "zod";
import { MAX_RESPONSE_NOTE_LENGTH } from "@/features/poll/schema";

// Whitespace-only notes collapse to undefined so no empty string is persisted.
export const responseNoteInput = z
  .string()
  .trim()
  .max(MAX_RESPONSE_NOTE_LENGTH)
  .optional()
  .transform((value) => value || undefined);

const participantNameInput = z.string().trim().min(1).max(100);

const voteInput = z.object({
  optionId: z.string(),
  type: z.enum(["yes", "no", "ifNeedBe"]),
});

export type VoteInput = z.infer<typeof voteInput>;

export const addParticipantSchema = z.object({
  pollId: z.string(),
  name: participantNameInput,
  // The form sends "" for a blank optional email.
  email: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .pipe(z.email().optional()),
  note: responseNoteInput,
  timeZone: z.string().optional(),
  // The token from an emailed invite link; the response takes it over.
  token: z.string().optional(),
  votes: voteInput.array(),
});

export const updateParticipantVotesSchema = z.object({
  participantId: z.string(),
  votes: voteInput.array(),
  token: z.string().optional(),
});

export const renameParticipantSchema = z.object({
  participantId: z.string(),
  name: participantNameInput,
  token: z.string().optional(),
});

export const deleteParticipantSchema = z.object({
  participantId: z.string(),
  token: z.string().optional(),
});
