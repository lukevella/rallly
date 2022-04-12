import { GetPollApiResponse } from "api-client/get-poll";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import { exclude, getQueryParam } from "utils/api-utils";
import { getMongoClient } from "utils/mongodb-client";
import { nanoid } from "utils/nanoid";
import { prisma } from "../../../db";

interface LegacyPoll {
  __private: {
    verificationCode: string;
  };
  _id: string;
  title: string;
  location: string;
  isExample: boolean;
  isDeleted: boolean;
  isClosed: boolean;
  emails: string[];
  description: string;
  dates?: Date[];
  creator: {
    name: string;
    email: string;
    isVerified: boolean;
    allowNotifications: boolean;
  };
  created: Date;
  comments?: Array<{
    _id: ObjectId;
    author: {
      name: string;
    };
    content: string;
    created: Date;
  }>;
  participants?: Array<{
    _id: ObjectId;
    name: string;
    votes?: boolean[];
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetPollApiResponse>,
) {
  const urlId = getQueryParam(req, "urlId");

  const existingPoll = await prisma.poll.findUnique({ where: { urlId } });

  if (existingPoll) {
    // if the poll already exists with this id then we probably shouldn't be here
    return res.status(400).end();
  }

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
      value: date.substring(0, date.indexOf("T")), // remove time
    });
  }

  const newParticipants = legacyPoll.participants?.map((legacyParticipant) => ({
    name: legacyParticipant.name,
    id: legacyParticipant._id.toString(),
  }));

  const votes: Array<{ optionId: string; participantId: string }> = [];

  newParticipants?.forEach((p, i) => {
    const legacyVotes = legacyPoll.participants![i].votes;
    legacyVotes?.forEach((v, j) => {
      if (v) {
        votes.push({
          optionId: newOptions[j].id,
          participantId: p.id,
        });
      }
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
      verificationCode: await nanoid(), // can't get it from api
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
        include: {
          votes: true,
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
    ...exclude(poll, "verificationCode"),
    role: "admin",
    urlId: poll.urlId,
    pollId: poll.urlId,
  });
}
