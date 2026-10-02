import type { PollConferencing } from "@/features/conferencing/schema";
import type { PollChange } from "./schema";

type ChangeAction = "added" | "changed" | "removed";

const settingFields = [
  "hideParticipants",
  "hideScores",
  "disableComments",
  "allowTentativeVotes",
  "requireParticipantEmail",
] as const;

type PollSettings = Record<(typeof settingFields)[number], boolean>;

const getChangeAction = (from: unknown, to: unknown): ChangeAction =>
  from === null ? "added" : to === null ? "removed" : "changed";

/**
 * The fields an edit changed, each with its previous value. `next` holds only
 * what the edit sent; an omitted field is unchanged. Empty strings and null
 * are the same absent value to the reader, so they compare equal.
 */
export function getPollChanges({
  prior,
  next,
}: {
  prior: {
    title: string;
    description: string | null;
    location: string | null;
    conferencing: PollConferencing | null;
    timeZone: string | null;
  } & PollSettings;
  next: {
    title?: string;
    description?: string;
    location?: string;
    conferencing?: PollConferencing | null;
    timeZone: string | null;
  } & Partial<PollSettings>;
}): PollChange[] {
  const changes: PollChange[] = [];

  if (next.title !== undefined && next.title !== prior.title) {
    changes.push({ field: "title", from: prior.title });
  }

  for (const field of ["description", "location"] as const) {
    const value = next[field];
    if (value === undefined) {
      continue;
    }
    const from = prior[field] || null;
    const to = value || null;
    if (from !== to) {
      changes.push({ field, action: getChangeAction(from, to), from });
    }
  }

  if (
    next.conferencing !== undefined &&
    JSON.stringify(next.conferencing) !== JSON.stringify(prior.conferencing)
  ) {
    changes.push({
      field: "conferencing",
      action: getChangeAction(prior.conferencing, next.conferencing),
      from: prior.conferencing,
    });
  }

  if (next.timeZone !== prior.timeZone) {
    changes.push({ field: "timeZone", from: prior.timeZone });
  }

  for (const field of settingFields) {
    const value = next[field];
    if (value !== undefined && value !== prior[field]) {
      changes.push({ field, from: prior[field] });
    }
  }

  return changes;
}
