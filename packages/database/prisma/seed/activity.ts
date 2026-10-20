import { randomUUID } from "node:crypto";
import type { Prisma } from "../../generated/prisma/client";
import type { PollDef } from "./data";

// Builds a believable history for a seeded poll: when it was created, who was
// invited, when each response arrived, and the edits and status changes in
// between. Everything is derived from the poll definition and a per-poll
// random stream, so reseeding produces the same history relative to today.

// 32 alphanumeric characters, the floor on Participant.token and PollInvite.token.
export function generateAccessToken() {
  return randomUUID().replace(/-/g, "");
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SeedActivity = {
  type: string;
  userId?: string | null;
  participantId?: string;
  inviteId?: string;
  optionId?: string;
  payload: Prisma.InputJsonObject;
  createdAt: Date;
};

export type SeedInvite = {
  id: string;
  email: string;
  token: string;
  participantId?: string;
  openedAt?: Date;
  remindedAt?: Date;
  createdAt: Date;
};

const pendingInvitees = [
  "sam.ortiz@example.com",
  "priya.shah@example.com",
  "jordan.lee@example.com",
  "morgan.blake@example.com",
];

export function buildPollHistory({
  index,
  poll,
  optionIds,
  participantIds,
  participantTokens,
  nextId,
  now = new Date(),
}: {
  index: number;
  poll: PollDef;
  optionIds: string[];
  participantIds: string[];
  participantTokens: string[];
  nextId: () => string;
  now?: Date;
}) {
  const random = createRandom(index + 1);
  const between = (from: number, to: number) => from + random() * (to - from);

  const optionStarts = poll.options.map((opt) =>
    new Date(opt.startTime).getTime(),
  );
  const firstOption = Math.min(...optionStarts);
  const nowMs = now.getTime();

  // Voting ends when the first option arrives, or now, whichever is sooner.
  const isFinished = poll.status !== "open";
  const end = Math.min(nowMs - 30 * MINUTE, firstOption - 2 * HOUR);
  const createdAt = end - between(4, 12) * DAY;
  // A finished poll leaves a day at the end for the host to close it.
  const responseEnd = isFinished ? end - DAY : end;

  const activities: SeedActivity[] = [];
  const invites: SeedInvite[] = [];

  activities.push({
    type: "poll_created",
    userId: poll.userId,
    payload: { title: poll.title },
    createdAt: new Date(createdAt),
  });

  // Responses arrive front loaded: most people answer in the first days.
  const hostIndex = poll.participants.findIndex(
    (p) => p.userId === poll.userId,
  );
  const responseTimes = poll.participants.map((_, i) => {
    if (i === hostIndex) {
      return createdAt + between(2, 20) * MINUTE;
    }
    const share = random() ** 1.8;
    return createdAt + HOUR + share * (responseEnd - createdAt - HOUR);
  });

  // Every other poll was shared by email invite rather than only by link.
  const usesInvites = index % 2 === 0;
  const invitedAt = createdAt + between(10, 40) * MINUTE;
  if (usesInvites) {
    poll.participants.forEach((participant, i) => {
      if (!participant.email || i === hostIndex) {
        return;
      }
      const respondedAt = responseTimes[i] ?? invitedAt;
      responseTimes[i] = Math.max(respondedAt, invitedAt + 5 * MINUTE);
      invites.push({
        id: nextId(),
        email: participant.email,
        // A response made through an invite takes the invite's token.
        token: participantTokens[i] ?? generateAccessToken(),
        participantId: participantIds[i],
        openedAt: new Date((responseTimes[i] ?? invitedAt) - 4 * MINUTE),
        createdAt: new Date(invitedAt),
      });
    });

    // Open polls still wait on a couple of people.
    if (!isFinished) {
      const pendingCount = 1 + (index % 3);
      const taken = new Set(
        poll.participants.flatMap((p) => [
          p.email?.toLowerCase(),
          p.name.toLowerCase().replace(/\s+/g, "."),
        ]),
      );
      const available = pendingInvitees.filter(
        (email) => !taken.has(email) && !taken.has(email.split("@")[0] ?? ""),
      );
      for (const email of available.slice(0, pendingCount)) {
        const opened = random() < 0.5;
        invites.push({
          id: nextId(),
          email,
          token: generateAccessToken(),
          openedAt: opened
            ? new Date(between(invitedAt + HOUR, end))
            : undefined,
          createdAt: new Date(invitedAt),
        });
      }
    }

    for (const invite of invites) {
      activities.push({
        type: "invite_sent",
        userId: poll.userId,
        inviteId: invite.id,
        payload: { email: invite.email },
        createdAt: invite.createdAt,
      });
      if (invite.openedAt) {
        activities.push({
          type: "invite_opened",
          inviteId: invite.id,
          payload: { email: invite.email },
          createdAt: invite.openedAt,
        });
      }
    }

    // A reminder to whoever hadn't answered after a few days.
    const unanswered = invites.filter((invite) => !invite.participantId);
    const remindedAt = invitedAt + 3 * DAY;
    if (unanswered.length > 0 && remindedAt < end) {
      for (const invite of unanswered) {
        invite.remindedAt = new Date(remindedAt);
        activities.push({
          type: "invite_reminded",
          userId: poll.userId,
          inviteId: invite.id,
          payload: { email: invite.email },
          createdAt: new Date(remindedAt),
        });
      }
    }
  }

  poll.participants.forEach((participant, i) => {
    const participantId = participantIds[i];
    if (!participantId) {
      return;
    }
    activities.push({
      type: "response_created",
      userId: participant.userId ?? null,
      participantId,
      payload: {
        name: participant.name,
        ...(participant.note ? { note: participant.note } : {}),
      },
      createdAt: new Date(responseTimes[i] ?? createdAt),
    });
  });

  // Someone changes their mind on one poll in three.
  const changer = poll.participants.findIndex(
    (_p, i) => i !== hostIndex && i % 2 === 1,
  );
  const changerId = participantIds[changer];
  const changerTime = responseTimes[changer];
  if (index % 3 === 0 && changerId && changerTime !== undefined) {
    const changedAt = changerTime + between(2, 30) * HOUR;
    if (changedAt < responseEnd) {
      activities.push({
        type: "response_updated",
        userId: poll.participants[changer]?.userId ?? null,
        participantId: changerId,
        payload: { name: poll.participants[changer]?.name ?? "" },
        createdAt: new Date(changedAt),
      });
    }
  }

  // The host fills in a detail they skipped at creation on some polls.
  if (index % 4 === 1) {
    const editedAt = createdAt + between(3, 26) * HOUR;
    if (editedAt < responseEnd) {
      activities.push({
        type: "poll_updated",
        userId: poll.userId,
        payload: {
          changes: poll.location
            ? [{ field: "location", action: "added", from: null }]
            : [{ field: "description", action: "added", from: null }],
        },
        createdAt: new Date(editedAt),
      });
    }
  }

  if (poll.status === "closed") {
    const reason = poll.closedReason ?? "manual";
    // Auto close runs once every option has passed.
    const closedAt =
      reason === "auto"
        ? Math.min(Math.max(...optionStarts) + HOUR, nowMs - 10 * MINUTE)
        : end;
    activities.push({
      type: "poll_closed",
      userId: reason === "auto" ? null : poll.userId,
      payload: { reason },
      createdAt: new Date(closedAt),
    });
  }

  if (poll.status === "scheduled") {
    // The host picks the option with the most yes votes, earliest on ties.
    const yesCounts = poll.options.map(
      (_, i) => poll.participants.filter((p) => p.votes[i] === "yes").length,
    );
    const best = yesCounts.indexOf(Math.max(...yesCounts));
    const option = poll.options[best];
    if (option) {
      activities.push({
        type: "poll_scheduled",
        userId: poll.userId,
        optionId: optionIds[best],
        payload: {
          start: new Date(option.startTime).toISOString(),
          duration: option.duration,
        },
        createdAt: new Date(end),
      });
    }
  }

  return {
    createdAt: new Date(createdAt),
    participantCreatedAt: responseTimes.map((time) => new Date(time)),
    invites,
    activities: activities
      .filter((activity) => activity.createdAt.getTime() <= nowMs)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
  };
}
