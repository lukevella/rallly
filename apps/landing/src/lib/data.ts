import "server-only";

import { prisma } from "@rallly/database";
import { cacheLife } from "next/cache";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const getMonthlyPollCount = async () => {
  "use cache";
  cacheLife("days");
  return prisma.poll.count({
    where: {
      deleted: false,
      participants: {
        some: {
          createdAt: { gte: new Date(Date.now() - THIRTY_DAYS_MS) },
        },
      },
    },
  });
};

export const getMonthlyVoterCount = async () => {
  "use cache";
  cacheLife("days");
  return prisma.participant.count({
    where: {
      createdAt: { gte: new Date(Date.now() - THIRTY_DAYS_MS) },
    },
  });
};
