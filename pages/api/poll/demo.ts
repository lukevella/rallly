import { addMinutes } from "date-fns";
import { NextApiRequest, NextApiResponse } from "next";
import { nanoid } from "utils/nanoid";
import { prisma } from "../../../db";

const participantData = [
  {
    name: "Reed",
    votes: [0, 2],
  },
  {
    name: "Susan",
    votes: [0, 1, 2],
  },
  {
    name: "Johnny",
    votes: [2, 3],
  },
  {
    name: "Ben",
    votes: [0, 1, 2, 3],
  },
];

const optionValues = ["2022-12-14", "2022-12-15", "2022-12-16", "2022-12-17"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    case "POST": {
      const adminUrlId = await nanoid();
      const demoUser = { name: "John Example", email: "noreply@rallly.co" };
      const today = new Date();

      let options: Array<{ value: string; id: string }> = [];

      for (let i = 0; i < optionValues.length; i++) {
        options.push({ id: await nanoid(), value: optionValues[i] });
      }

      let participants: Array<{
        name: string;
        id: string;
        createdAt: Date;
      }> = [];

      let votes: Array<{ optionId: string; participantId: string }> = [];

      for (let i = 0; i < participantData.length; i++) {
        const { name, votes: participantVotes } = participantData[i];
        const participantId = await nanoid();
        participants.push({
          id: participantId,
          name,
          createdAt: addMinutes(today, i * -1),
        });

        participantVotes.forEach((voteIndex) => {
          const option = options[voteIndex];
          votes.push({ optionId: option.id, participantId });
        });
      }

      await prisma.poll.create({
        data: {
          urlId: await nanoid(),
          verificationCode: await nanoid(),
          title: "Lunch Meeting Demo",
          type: "date",
          location: "Starbucks, 901 New York Avenue",
          description:
            "This poll has been automatically generated just for you! Feel free to try out all the different features and when you're ready, you can go to https://rallly.co/new to make a new poll.",
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

      return res.json({ urlId: adminUrlId });
    }
    default:
      return res.status(405).json({ ok: 1 });
  }
}
