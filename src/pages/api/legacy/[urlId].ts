import { VoteType } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";

import { getQueryParam } from "@/utils/api-utils";
import { LegacyPoll } from "@/utils/legacy-utils";
import { getMongoClient } from "@/utils/mongodb-client";
import { nanoid } from "@/utils/nanoid";
import { GetPollApiResponse } from "@/utils/trpc/types";
import { prisma } from "~/prisma/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetPollApiResponse>,
) {
  const urlId = getQueryParam(req, "urlId");

  const client = await getMongoClient();
  if (!client) {
    // This environment is not configured to retrieve legacy polls
    // from mongodb
    return res.status(404).end();
  }

  const db = client.db("rallly-db");
  const collection = db.collection("events");

  const legacyPoll = await collection.findOne<LegacyPoll>({ _id: urlId });

  if (
    !legacyPoll ||
    !legacyPoll.dates ||
    legacyPoll.dates.length === 0 ||
    legacyPoll.isDeleted === true
  ) {
    // return 404 if poll is missing or malformed or deleted
    return res.status(404).end();
  }

  const newOptions: Array<{ id: string; value: string }> = [];

  for (let i = 0; i < legacyPoll.dates.length; i++) {
    const date = legacyPoll.dates[i].toISOString();
    newOptions.push({
      id: await nanoid(),
      value: date,
    });
  }

  const newParticipants = legacyPoll.participants?.map((legacyParticipant) => ({
    name: legacyParticipant.name,
    id: legacyParticipant._id.toString(),
  }));

  const votes: Array<{
    optionId: string;
    participantId: string;
    type: VoteType;
  }> = [];

  newParticipants?.forEach((p, i) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const legacyVotes = legacyPoll.participants![i].votes;
    legacyVotes?.forEach((v, j) => {
      votes.push({
        optionId: newOptions[j].id,
        participantId: p.id,
        type: v ? "yes" : "no",
      });
    });
  });

  const poll = await prisma.poll.create({
    data: {
      legacy: true,
      closed: legacyPoll.isClosed,
      urlId: legacyPoll._id,
      title: legacyPoll.title,
      location: legacyPoll.location,
      description: legacyPoll.description,
      demo: legacyPoll.isExample,
      createdAt: new Date(legacyPoll.created),
      type: "date",
      authorName: legacyPoll.creator.name,
      verified: legacyPoll.creator.isVerified,
      user: {
        connectOrCreate: {
          where: {
            email: legacyPoll.creator.email,
          },
          create: {
            id: await nanoid(),
            email: legacyPoll.creator.email,
            name: legacyPoll.creator.name,
          },
        },
      },
      notifications: legacyPoll.creator.allowNotifications,
      options: {
        createMany: {
          data: newOptions,
        },
      },
      participants: {
        createMany: {
          data: newParticipants ?? [],
        },
      },
      votes: {
        createMany: {
          data: votes,
        },
      },
      comments: {
        createMany: {
          data:
            legacyPoll.comments?.map((legacyComment) => ({
              content: legacyComment.content,
              createdAt: new Date(legacyComment.created),
              authorName: legacyComment.author.name,
            })) ?? [],
        },
      },
      links: {
        createMany: {
          data: [
            {
              role: "admin",
              urlId: legacyPoll._id,
            },
            {
              role: "participant",
              urlId: await nanoid(),
            },
          ],
        },
      },
    },
    include: {
      options: {
        orderBy: {
          value: "asc",
        },
      },
      participants: {
        include: {
          votes: true,
        },
        orderBy: [
          {
            createdAt: "desc",
          },
          { name: "desc" },
        ],
      },
      user: true,
      links: true,
    },
  });

  return res.json({
    ...poll,
    role: "admin",
    urlId: poll.urlId,
    pollId: poll.urlId,
  });
}
