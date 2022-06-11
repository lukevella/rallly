import { VoteType } from "@prisma/client";
import addMinutes from "date-fns/addMinutes";

import { prisma } from "~/prisma/db";

import { nanoid } from "../../../utils/nanoid";
import { createRouter } from "../../createRouter";

const participantData: Array<{ name: string; votes: VoteType[] }> = [
  {
    name: "Reed",
    votes: ["yes", "no", "ifNeedBe", "no"],
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
  {
    name: "James",
    votes: ["yes", "no", "ifNeedBe", "no"],
  },
  {
    name: "Alfie",
    votes: ["yes", "yes", "yes", "no"],
  },
  {
    name: "Sam",
    votes: ["no", "no", "yes", "yes"],
  },
  {
    name: "Carmen",
    votes: ["yes", "yes", "yes", "yes"],
  },
  {
    name: "Anne",
    votes: ["yes", "no", "ifNeedBe", "no"],
  },
  {
    name: "Martha",
    votes: ["yes", "yes", "yes", "no"],
  },
  {
    name: "Joe P.",
    votes: ["no", "no", "yes", "yes"],
  },
  {
    name: "Luke",
    votes: ["yes", "yes", "yes", "yes"],
  },
];

const optionValues = ["2022-12-14", "2022-12-15", "2022-12-16", "2022-12-17"];

export const demo = createRouter().mutation("create", {
  resolve: async () => {
    const adminUrlId = await nanoid();
    const demoUser = { name: "John Example", email: "noreply@rallly.co" };
    const today = new Date();

    const options: Array<{ value: string; id: string }> = [];

    for (let i = 0; i < optionValues.length; i++) {
      options.push({ id: await nanoid(), value: optionValues[i] });
    }

    const participants: Array<{
      name: string;
      id: string;
      guestId: string;
      createdAt: Date;
    }> = [];

    const votes: Array<{
      optionId: string;
      participantId: string;
      type: VoteType;
    }> = [];

    for (let i = 0; i < participantData.length; i++) {
      const { name, votes: participantVotes } = participantData[i];
      const participantId = await nanoid();
      participants.push({
        id: participantId,
        name,
        guestId: "user-demo",
        createdAt: addMinutes(today, i * -1),
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
        urlId: await nanoid(),
        title: "Lunch Meeting",
        type: "date",
        location: "Starbucks, 901 New York Avenue",
        description: `Hey everyone, please choose the dates when you are available to meet for our monthly get together. Looking forward to see you all!`,
        authorName: "Johnny",
        verified: true,
        demo: true,
        user: {
          connectOrCreate: {
            where: {
              email: demoUser.email,
            },
            create: demoUser,
          },
        },
        options: {
          createMany: {
            data: options,
          },
        },
        links: {
          createMany: {
            data: [
              {
                role: "admin",
                urlId: adminUrlId,
              },
              {
                role: "participant",
                urlId: await nanoid(),
              },
            ],
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

    return adminUrlId;
  },
});
