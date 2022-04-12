import { ObjectId } from "mongodb";
import { getMongoClient } from "./mongodb-client";
import { prisma } from "../db";

export interface LegacyPoll {
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

export const resetDates = async (legacyPollId: string) => {
  const client = await getMongoClient();
  if (!client) {
    return;
  }
  const db = client.db("rallly-db");
  const collection = db.collection("events");

  const legacyPoll = await collection.findOne<LegacyPoll>({
    _id: legacyPollId,
  });

  if (!legacyPoll) {
    return;
  }

  const existingOptions = await prisma.option.findMany({
    where: { pollId: legacyPoll._id },
    orderBy: {
      value: "asc",
    },
  });

  if (!existingOptions) {
    return;
  }

  const promises = [];
  for (let i = 0; i < existingOptions.length; i++) {
    const legacyOption = legacyPoll.dates?.find(
      (date) =>
        date.toISOString().substring(0, 10) === existingOptions[i].value,
    );
    if (legacyOption) {
      promises.push(
        prisma.option.update({
          where: { id: existingOptions[i].id },
          data: {
            value: legacyOption.toISOString(),
          },
        }),
      );
    }
  }
  await prisma.$transaction(promises);

  const poll = await prisma.poll.findUnique({
    where: {
      urlId: legacyPoll._id,
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

  return poll;
};
