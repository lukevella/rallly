import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import {
  polls,
  scheduledEvents,
  spaceMembers,
  spaces,
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

async function main() {
  // 1. Users
  await prisma.user.createMany({ data: users.map((u) => ({ ...u })) });
  console.info(`✓ ${users.length} users`);

  // 2. Spaces
  await prisma.space.createMany({ data: spaces });
  console.info(`✓ ${spaces.length} spaces`);

  // 3. Space members
  await prisma.spaceMember.createMany({ data: spaceMembers });
  console.info(`✓ ${spaceMembers.length} space members`);

  // 4. Scheduled events + invites
  let inviteCount = 0;
  for (const evt of scheduledEvents) {
    const eventId = nextId();
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
        data: evt.invites.map((inv) => ({
          id: nextId(),
          scheduledEventId: eventId,
          inviteeName: inv.inviteeName,
          inviteeEmail: inv.inviteeEmail,
          inviteeTimeZone: inv.inviteeTimeZone,
          inviteeId: inv.inviteeId,
          status: inv.status,
        })),
      });
      inviteCount += evt.invites.length;
    }
  }
  console.info(
    `✓ ${scheduledEvents.length} scheduled events, ${inviteCount} invites`,
  );

  // 5. Polls + options + participants + votes + comments
  let optionCount = 0;
  let participantCount = 0;
  let voteCount = 0;
  let commentCount = 0;

  for (const poll of polls) {
    const pollId = nextId();
    const adminUrlId = nextId();
    const participantUrlId = nextId();

    await prisma.poll.create({
      data: {
        id: pollId,
        title: poll.title,
        description: poll.description,
        location: poll.location,
        status: poll.status,
        timeZone: poll.timeZone,
        deadline: poll.deadline ? new Date(poll.deadline) : undefined,
        userId: poll.userId,
        spaceId: poll.spaceId,
        adminUrlId,
        participantUrlId,
        hideParticipants: poll.hideParticipants,
        hideScores: poll.hideScores,
        disableComments: poll.disableComments,
        requireParticipantEmail: poll.requireParticipantEmail,
      },
    });

    // Options
    const optionIds: string[] = [];
    for (let i = 0; i < poll.options.length; i++) {
      optionIds.push(nextId());
    }
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
    for (const part of poll.participants) {
      const participantId = nextId();
      await prisma.participant.create({
        data: {
          id: participantId,
          pollId,
          name: part.name,
          email: part.email,
          userId: part.userId,
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
    `✓ ${polls.length} polls, ${optionCount} options, ${participantCount} participants, ${voteCount} votes, ${commentCount} comments`,
  );
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
