import { VoteType } from "@prisma/client";
import addMinutes from "date-fns/addMinutes";

import { prisma } from "~/prisma/db";

import { absoluteUrl } from "../../../utils/absolute-url";
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

    const homePageUrl = absoluteUrl();

    await prisma.poll.create({
      data: {
        urlId: await nanoid(),
        title: "Lunch Meeting Demo",
        type: "date",
        location: "Starbucks, 901 New York Avenue",
        description: `This poll has been automatically generated just for you! Feel free to try out all the different features and when you're ready, you can go to ${homePageUrl}/new to make a new poll.`,
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
