import { prisma, VoteType } from "@rallly/database";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

const participantData: Array<{ name: string; votes: VoteType[] }> = [
  {
    name: "Reed",
    votes: ["yes", "no", "yes", "no"],
  },
  {
    name: "Susan",
    votes: ["yes", "yes", "yes", "no"],
  },
  {
    name: "Johnny",
    votes: ["no", "no", "yes", "yes"],
  },
  {
    name: "Ben",
    votes: ["yes", "yes", "yes", "yes"],
  },
];

const optionValues = ["2022-12-14", "2022-12-15", "2022-12-16", "2022-12-17"];

export const createPoll = async () => {
  const pollId = nanoid();

  const adminUrlId = nanoid();

  const options: Array<{ start: Date; id: string }> = [];

  for (let i = 0; i < optionValues.length; i++) {
    options.push({ id: nanoid(), start: new Date(optionValues[i]) });
  }

  const participants: Array<{
    name: string;
    id: string;
    userId: string;
    createdAt: Date;
  }> = [];

  const votes: Array<{
    optionId: string;
    participantId: string;
    type: VoteType;
  }> = [];

  for (let i = 0; i < participantData.length; i++) {
    const { name, votes: participantVotes } = participantData[i];
    const participantId = nanoid();
    participants.push({
      id: participantId,
      name,
      userId: "user-demo",
      createdAt: dayjs()
        .add(i * -1, "minutes")
        .toDate(),
    });

    options.forEach((option, index) => {
      votes.push({
        optionId: option.id,
        participantId,
        type: participantVotes[index],
      });
    });
  }

  await prisma.poll.create({
    data: {
      id: pollId,
      title: "Lunch Meeting",
      location: "Starbucks, 901 New York Avenue",
      description: `Hey everyone, please choose the dates when you are available to meet for our monthly get together. Looking forward to see you all!`,
      demo: true,
      adminUrlId,
      participantUrlId: nanoid(),
      userId: "guest-user",
      options: {
        createMany: {
          data: options,
        },
      },
      participants: {
        createMany: {
          data: participants,
        },
      },
      votes: {
        createMany: {
          data: votes,
        },
      },
    },
  });

  return pollId;
};

export const deletePoll = async (pollId: string) => {
  await prisma.$transaction([
    prisma.vote.deleteMany({
      where: {
        pollId,
      },
    }),
    prisma.option.deleteMany({
      where: {
        pollId,
      },
    }),
    prisma.participant.deleteMany({
      where: {
        pollId,
      },
    }),
    prisma.comment.deleteMany({
      where: {
        pollId,
      },
    }),
    prisma.poll.deleteMany({
      where: {
        id: pollId,
      },
    }),
  ]);
};
