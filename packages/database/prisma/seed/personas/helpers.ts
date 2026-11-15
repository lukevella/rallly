import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Prisma, VoteType } from "../../../generated/prisma/client";
import type { EventTypeDef, PollDef, ScheduledEventDef } from "../data";

export type Person = {
  name: string;
  email?: string;
  userId?: string;
  note?: string;
};

export type Persona = {
  users: Array<{ id: string; name: string; email: string; timeZone: string }>;
  space: Prisma.SpaceCreateManyInput & { id: string };
  members: Prisma.SpaceMemberCreateManyInput[];
  subscription?: Omit<
    Prisma.SubscriptionCreateManyInput,
    "periodStart" | "periodEnd" | "spaceId"
  > & { periodStart: string; periodEnd: string };
  polls: PollDef[];
  events: ScheduledEventDef[];
  eventTypes?: EventTypeDef[];
};

const DAY = 86_400_000;

function zoneOffset(timeZone: string, utcMs: number) {
  // biome-ignore lint/plugin: reads a zone's wall clock for seed arithmetic, nothing is shown to a user
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return (
    Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    ) - utcMs
  );
}

function localToday(timeZone: string) {
  const now = Date.now();
  const local = new Date(now + zoneOffset(timeZone, now));
  return Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  );
}

/**
 * A clock reading in a time zone, `offsetDays` from today in that zone, as an
 * ISO instant. Lets persona polls read "10:00 in Chicago" instead of UTC.
 */
export function zoned(timeZone: string) {
  return (offsetDays: number, hour: number, minute = 0) => {
    const guess =
      localToday(timeZone) + offsetDays * DAY + (hour * 60 + minute) * 60_000;
    const first = guess - zoneOffset(timeZone, guess);
    return new Date(guess - zoneOffset(timeZone, first)).toISOString();
  };
}

/** Every listed time on every listed day, the shape of most real time polls. */
export function grid(
  at: ReturnType<typeof zoned>,
  days: number[],
  times: Array<number | [number, number]>,
  duration: number,
) {
  return days.flatMap((offset) =>
    times.map((time) => {
      const [hour, minute] = typeof time === "number" ? [time, 0] : time;
      return { startTime: at(offset, hour, minute), duration };
    }),
  );
}

/** All-day options on the given day offsets. */
export function days(offsets: number[]) {
  return offsets.map((offset) => ({ startTime: day(offset), duration: 0 }));
}

/** Midnight UTC `offsetDays` from today: the storage shape of an all-day option. */
export function day(offsetDays: number) {
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base.toISOString();
}

/**
 * Day offsets of the next `count` days falling on the given weekdays
 * (0 = Sunday) in a time zone, starting at least `from` days out.
 */
export function onWeekdays(
  timeZone: string,
  weekdays: number[],
  count: number,
  from = 1,
) {
  const todayDow = new Date(localToday(timeZone)).getUTCDay();
  const offsets: number[] = [];
  for (let offset = from; offsets.length < count; offset++) {
    if (weekdays.includes((todayDow + offset) % 7)) {
      offsets.push(offset);
    }
  }
  return offsets;
}

export const MON_FRI = [1, 2, 3, 4, 5];

function random(seed: string) {
  let state = 2166136261;
  for (const char of seed) {
    state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  }
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Availability-style responses: each person votes on every option, with the
 * `favoured` options most people can make so the poll has a believable winner.
 */
export function respond(
  key: string,
  optionCount: number,
  people: Person[],
  {
    yes = 0.45,
    ifNeedBe = 0.15,
    favoured = [],
  }: { yes?: number; ifNeedBe?: number; favoured?: number[] } = {},
): PollDef["participants"] {
  return people.map((person) => {
    const next = random(`${key}:${person.name}`);
    const votes = Array.from({ length: optionCount }, (_, i): VoteType => {
      const roll = next();
      const yesShare = favoured.includes(i) ? 0.85 : yes;
      if (roll < yesShare) return "yes";
      if (roll < yesShare + ifNeedBe) return "ifNeedBe";
      return "no";
    });
    return { ...person, votes };
  });
}

/**
 * Sign-up sheet responses: a poll used as a sheet, where each person takes
 * one slot (or a few) and says no to the rest.
 */
export function signUp(
  optionCount: number,
  people: Array<Person & { slots: number[] }>,
): PollDef["participants"] {
  return people.map(({ slots, ...person }) => ({
    ...person,
    votes: Array.from(
      { length: optionCount },
      (_, i): VoteType => (slots.includes(i) ? "yes" : "no"),
    ),
  }));
}

/**
 * Marks a poll as scheduled and builds its event at the option the host
 * would pick: most yes votes, earliest on ties (the rule the activity
 * history uses too).
 */
export function schedule(
  poll: PollDef,
  event: Omit<
    ScheduledEventDef,
    "start" | "end" | "allDay" | "title" | "timeZone" | "userId" | "spaceId"
  > & { id: string; title?: string },
): ScheduledEventDef {
  const yesCounts = poll.options.map(
    (_, i) => poll.participants.filter((p) => p.votes[i] === "yes").length,
  );
  const best = poll.options[yesCounts.indexOf(Math.max(...yesCounts))];
  if (!best) {
    throw new Error(`Poll "${poll.title}" has no options to schedule`);
  }
  poll.status = "scheduled";
  poll.scheduledEventId = event.id;

  const start = new Date(best.startTime);
  const allDay = best.duration === 0;
  const end = new Date(
    start.getTime() + (allDay ? DAY : best.duration * 60_000),
  );
  return {
    title: poll.title,
    description: poll.description,
    location: poll.location
      ? { provider: "custom", address: poll.location }
      : undefined,
    timeZone: allDay ? undefined : poll.timeZone,
    userId: poll.userId,
    spaceId: poll.spaceId,
    ...event,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay,
  };
}

/** Invites for an event, taken from a poll's respondents who left an email. */
export function invitesFrom(
  poll: PollDef,
  declined: string[] = [],
): NonNullable<ScheduledEventDef["invites"]> {
  return poll.participants
    .filter((p) => p.email && p.userId !== poll.userId)
    .map((p) => ({
      inviteeName: p.name,
      inviteeEmail: p.email as string,
      inviteeId: p.userId,
      status: declined.includes(p.name) ? "declined" : "accepted",
    }));
}

/** A logo from `seed/logos`, inlined as a data URI so seeding needs no object storage. */
export function logo(name: string) {
  const svg = readFileSync(join(__dirname, "..", "logos", `${name}.svg`));
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}
