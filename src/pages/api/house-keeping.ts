import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "~/prisma/db";

/**
 * DANGER: This endpoint will permanently delete polls.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method not allowed");
    return;
  }

  const { authorization } = req.headers;

  if (authorization !== `Bearer ${process.env.API_SECRET}`) {
    res.status(401).json({ success: false });
    return;
  }

  // soft delete polls that have not been accessed for over 30 days
  const inactivePolls = await prisma.poll.deleteMany({
    where: {
      deleted: false,
      touchedAt: {
        lte: dayjs().add(-30, "days").toDate(),
      },
    },
  });

  // Permantly delete old demos and polls that have been soft deleted for 7 days
  const pollIdsToDelete = (
    await prisma.poll.findMany({
      where: {
        OR: [
          {
            deleted: true,
            deletedAt: {
              lte: dayjs().add(-7, "days").toDate(),
            },
          },
          // demo polls that are 1 day old
          {
            demo: true,
            createdAt: {
              lte: dayjs().add(-1, "days").toDate(),
            },
          },
        ],
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: "asc", // oldest first
      },
    })
  ).map(({ id }) => id);

  if (pollIdsToDelete.length !== 0) {
    // Delete comments
    await prisma.comment.deleteMany({
      where: {
        pollId: {
          in: pollIdsToDelete,
        },
      },
    });

    await prisma.vote.deleteMany({
      where: {
        pollId: {
          in: pollIdsToDelete,
        },
      },
    });

    // Delete participants
    await prisma.participant.deleteMany({
      where: {
        pollId: {
          in: pollIdsToDelete,
        },
      },
    });

    // Delete options
    await prisma.option.deleteMany({
      where: {
        pollId: {
          in: pollIdsToDelete,
        },
      },
    });

    await prisma.$executeRaw`DELETE FROM options WHERE poll_id IN (${Prisma.join(
      pollIdsToDelete,
    )})`;

    // Delete polls
    // Using execute raw to bypass soft delete middelware
    await prisma.$executeRaw`DELETE FROM polls WHERE id IN (${Prisma.join(
      pollIdsToDelete,
    )})`;
  }

  res.status(200).json({
    inactive: inactivePolls.count,
    deleted: pollIdsToDelete.length,
  });
}
