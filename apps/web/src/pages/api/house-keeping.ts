import { Prisma, prisma } from "@rallly/database";
import dayjs from "dayjs";
import { NextApiRequest, NextApiResponse } from "next";

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

  // get polls that have not been accessed for over 30 days
  const thirtyDaysAgo = dayjs().subtract(30, "days").toDate();

  const oldPollsWithAllPastOptions = await prisma.poll.findMany({
    select: {
      id: true,
    },
    where: {
      touchedAt: { lte: thirtyDaysAgo },
      options: {
        every: {
          start: { lt: new Date() },
        },
      },
    },
  });

  const softDeletedPolls = await prisma.poll.deleteMany({
    where: {
      id: {
        in: oldPollsWithAllPastOptions.map(({ id }) => id),
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

    // Delete votes
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

    // Delete watchers
    await prisma.watcher.deleteMany({
      where: {
        pollId: {
          in: pollIdsToDelete,
        },
      },
    });

    // Delete polls
    // Using execute raw to bypass soft delete middelware
    await prisma.$executeRaw`DELETE FROM polls WHERE id IN (${Prisma.join(
      pollIdsToDelete,
    )})`;
  }

  res.status(200).json({
    softDeleted: softDeletedPolls.count,
    deleted: pollIdsToDelete.length,
  });
}
