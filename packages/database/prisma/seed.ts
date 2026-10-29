import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { buildPollHistory, generateAccessToken } from "./seed/activity";
import {
  eventTypes,
  polls,
  scheduledEvents,
  spaceMembers,
  spaces,
  subscriptions,
  users,
} from "./seed/data";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

let idCounter = 0;
function nextId() {
  return `seed-${(++idCounter).toString().padStart(4, "0")}`;
}

class DatabaseNotEmptyError extends Error {}

async function main() {
  if (await prisma.user.findFirst({ select: { id: true } })) {
    throw new DatabaseNotEmptyError(
      "The database already has data. Run `pnpm db:reset` to reset and seed it.",
    );
  }

  // 1. Users
  await prisma.user.createMany({ data: users.map((u) => ({ ...u })) });
  console.info(`✓ ${users.length} users`);

  // 2. Spaces
  await prisma.space.createMany({ data: spaces });
  console.info(`✓ ${spaces.length} spaces`);

  // 3. Space members
  await prisma.spaceMember.createMany({ data: spaceMembers });
  console.info(`✓ ${spaceMembers.length} space members`);

  // 4. Subscriptions
  await prisma.subscription.createMany({
    data: subscriptions.map((sub) => ({
      ...sub,
      periodStart: new Date(sub.periodStart),
      periodEnd: new Date(sub.periodEnd),
    })),
  });
  console.info(`✓ ${subscriptions.length} subscriptions`);

  // 5. Scheduled events + invites
  let inviteCount = 0;
  for (const evt of scheduledEvents) {
    const eventId = evt.id ?? nextId();
    const uid = crypto.randomUUID();

    await prisma.scheduledEvent.create({
      data: {
        id: eventId,
        uid,
        title: evt.title,
        description: evt.description,
        location: evt.location,
        status: evt.status,
        timeZone: evt.timeZone,
        start: new Date(evt.start),
        end: new Date(evt.end),
        allDay: evt.allDay,
        userId: evt.userId,
        spaceId: evt.spaceId,
      },
    });

    if (evt.invites?.length) {
      await prisma.scheduledEventInvite.createMany({
        data: evt.invites.map((inv) => {
          const inviteId = nextId();
          return {
            id: inviteId,
            uid: inviteId,
            scheduledEventId: eventId,
            inviteeName: inv.inviteeName,
            inviteeEmail: inv.inviteeEmail,
            inviteeTimeZone: inv.inviteeTimeZone,
            inviteeId: inv.inviteeId,
            status: inv.status,
          };
        }),
      });
      inviteCount += evt.invites.length;
    }
  }
  console.info(
    `✓ ${scheduledEvents.length} scheduled events, ${inviteCount} invites`,
  );

  // 6. Polls + options + participants + votes + comments
  let optionCount = 0;
  let participantCount = 0;
  let voteCount = 0;
  let commentCount = 0;
  let pollInviteCount = 0;
  let activityCount = 0;

  for (const [pollIndex, poll] of polls.entries()) {
    const pollId = nextId();
    const optionIds = poll.options.map(() => nextId());
    const participantIds = poll.participants.map(() => nextId());
    const participantTokens = poll.participants.map(() =>
      generateAccessToken(),
    );
    const history = buildPollHistory({
      index: pollIndex,
      poll,
      optionIds,
      participantIds,
      participantTokens,
      nextId,
    });

    const kind = poll.options.some((opt) => opt.duration > 0) ? "time" : "date";

    await prisma.poll.create({
      data: {
        id: pollId,
        title: poll.title,
        description: poll.description,
        location: poll.location,
        status: poll.status,
        closedReason: poll.closedReason,
        timeZone: poll.timeZone,
        deadline: poll.deadline ? new Date(poll.deadline) : undefined,
        userId: poll.userId,
        spaceId: poll.spaceId,
        scheduledEventId: poll.scheduledEventId,
        hideParticipants: poll.hideParticipants,
        hideScores: poll.hideScores,
        disableComments: poll.disableComments ?? !poll.comments?.length,
        requireParticipantEmail: poll.requireParticipantEmail,
        kind,
        createdAt: history.createdAt,
      },
    });

    // Options
    await prisma.option.createMany({
      data: poll.options.map((opt, i) => ({
        id: optionIds[i],
        pollId,
        startTime: new Date(opt.startTime),
        duration: opt.duration,
      })),
    });
    optionCount += poll.options.length;

    // Participants + votes
    for (const [participantIndex, part] of poll.participants.entries()) {
      const participantId = participantIds[participantIndex];
      await prisma.participant.create({
        data: {
          id: participantId,
          pollId,
          name: part.name,
          email: part.email,
          note: part.note,
          userId: part.userId,
          token: participantTokens[participantIndex],
          createdAt: history.participantCreatedAt[participantIndex],
        },
      });
      participantCount++;

      // Votes — one per option
      await prisma.vote.createMany({
        data: part.votes.map((voteType, i) => ({
          id: nextId(),
          pollId,
          participantId,
          optionId: optionIds[i],
          type: voteType,
        })),
      });
      voteCount += part.votes.length;
    }

    // Invites + activity history
    await prisma.pollInvite.createMany({
      data: history.invites.map((invite) => ({ ...invite, pollId })),
    });
    pollInviteCount += history.invites.length;

    await prisma.pollActivity.createMany({
      data: history.activities.map((activity) => ({
        id: nextId(),
        pollId,
        ...activity,
      })),
    });
    activityCount += history.activities.length;

    // Comments
    if (poll.comments?.length) {
      await prisma.comment.createMany({
        data: poll.comments.map((c) => ({
          id: nextId(),
          pollId,
          content: c.content,
          authorName: c.authorName,
          userId: c.userId,
        })),
      });
      commentCount += poll.comments.length;
    }
  }

  console.info(
    `✓ ${polls.length} polls, ${optionCount} options, ${participantCount} participants, ${voteCount} votes, ${commentCount} comments, ${pollInviteCount} invites, ${activityCount} activity entries`,
  );

  // 7. Event types
  const now = Date.now();
  await prisma.eventType.createMany({
    data: eventTypes.map((et, i) => ({
      id: et.id,
      spaceId: et.spaceId,
      hostId: et.hostId,
      name: et.name,
      duration: et.duration,
      capacity: et.capacity,
      description: et.description,
      location: et.location ?? undefined,
      updatedAt: new Date(now - i * 60_000),
    })),
  });
  console.info(`✓ ${eventTypes.length} event types`);
}

main()
  .catch((e) => {
    console.error(e instanceof DatabaseNotEmptyError ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
