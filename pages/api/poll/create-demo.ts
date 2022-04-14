import { addDays, addMinutes, format } from "date-fns";
import { NextApiRequest, NextApiResponse } from "next";
import { nanoid } from "utils/nanoid";

import { prisma } from "../../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  switch (req.method) {
    case "POST": {
      const adminUrlId = await nanoid();
      const demoUser = { name: "John Example", email: "noreply@rallly.co" };
      const today = new Date();
      const poll = await prisma.poll.create({
        data: {
          urlId: await nanoid(),
          verificationCode: await nanoid(),
          title: "Lunch Meeting Demo",
          type: "date",
          location: "Starbucks, 901 New York Avenue",
          description:
            "This poll has been automatically generated just for you! Feel free to try out all the different features and when you're ready, you can go to https://rallly.co/new to make a new poll.",
          authorName: "John Example",
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
              data: [...Array(4)].map((_, i) => {
                return { value: format(addDays(today, i + 1), "yyyy-MM-dd") };
              }),
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
              data: [
                { name: "John", createdAt: addMinutes(today, -1) },
                { name: "Alex", createdAt: addMinutes(today, -2) },
                { name: "Mark", createdAt: addMinutes(today, -3) },
                { name: "Samantha", createdAt: addMinutes(today, -4) },
              ],
            },
          },
        },
        include: {
          options: true,
          participants: true,
        },
      });

      const voteData: Array<{
        optionId: string;
        participantId: string;
        pollId: string;
      }> = [];

      // Randomly generate votes
      poll.options.forEach((option) => {
        poll.participants.forEach((participant) => {
          if (Math.random() >= 0.5) {
            voteData.push({
              optionId: option.id,
              participantId: participant.id,
              pollId: poll.urlId,
            });
          }
        });
      });

      await prisma.vote.createMany({
        data: voteData,
      });

      return res.json({ urlId: adminUrlId });
    }
    default:
      return res.status(405).json({ ok: 1 });
  }
}
