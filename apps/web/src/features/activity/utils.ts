import type { PollConferencing } from "@/features/conferencing/schema";
import type { PollActivityEvent, PollChange } from "./schema";

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

export type ActivityRow = {
  id: string;
  createdAt: Date;
  event: PollActivityEvent;
};

const groupableTypes = [
  "invite_sent",
  "invite_reminded",
  "response_created",
  "response_updated",
  "response_deleted",
] as const;

export type GroupableActivityType = (typeof groupableTypes)[number];

export type ActivityItem =
  | { kind: "single"; row: ActivityRow }
  | {
      kind: "group";
      type: GroupableActivityType;
      /** Oldest first; always two or more. */
      rows: ActivityRow[];
    };

const isGroupable = (
  type: PollActivityEvent["type"],
): type is GroupableActivityType =>
  (groupableTypes as readonly string[]).includes(type);

const BUCKET_GAP_MS = 12 * 60 * 60 * 1000;

/**
 * Folds a poll's activity, oldest first, into the rows a feed shows. Invite
 * opens are left out: the invitee list already says who opened. Within a
 * bucket (a run with no lifecycle event and no gap over 12 hours) events of
 * the same groupable kind merge into one item, placed at its latest event. A
 * response with a note stays on its own so the note is never hidden, and
 * lifecycle events always stand alone and end the bucket.
 */
export function groupActivity(rows: ActivityRow[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  let bucket: ActivityRow[] = [];
  let lastTime: number | null = null;

  const flush = () => {
    const byType = new Map<GroupableActivityType, ActivityRow[]>();
    const pieces: { at: number; item: ActivityItem }[] = [];
    for (const row of bucket) {
      const { type } = row.event;
      if (
        isGroupable(type) &&
        !(row.event.type === "response_created" && row.event.payload.note)
      ) {
        const list = byType.get(type) ?? [];
        list.push(row);
        byType.set(type, list);
      } else {
        pieces.push({
          at: row.createdAt.getTime(),
          item: { kind: "single", row },
        });
      }
    }
    for (const [type, list] of byType) {
      const sorted = [...list].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
      const latest = sorted[sorted.length - 1];
      if (!latest) continue;
      pieces.push({
        at: latest.createdAt.getTime(),
        item:
          sorted.length > 1
            ? { kind: "group", type, rows: sorted }
            : { kind: "single", row: latest },
      });
    }
    // Stable, so pieces at the same moment keep their insertion order
    pieces.sort((a, b) => a.at - b.at);
    items.push(...pieces.map(({ item }) => item));
    bucket = [];
  };

  for (const row of rows) {
    const { type } = row.event;
    if (type === "invite_opened") continue;
    const time = row.createdAt.getTime();
    if (lastTime !== null && time - lastTime > BUCKET_GAP_MS) {
      flush();
    }
    lastTime = time;
    if (isGroupable(type)) {
      bucket.push(row);
    } else {
      flush();
      items.push({ kind: "single", row });
    }
  }
  flush();
  return items;
}
