import { Prisma } from "@prisma/client";
import { addDays } from "date-fns";
import { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "~/prisma/db";

/**
 * This endpoint will permanently delete polls that:
 * * have been soft deleted OR
 * * are demo polls that are older than 1 day OR
 * * polls that have not been accessed for 30 days
 * All dependant records are also deleted.
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

  // Batch size is the max number of polls we will attempt to delete
  // We can adjust this value through the batchSize query param
  const parsedBatchSizeQueryParam =
    typeof req.query["batchSize"] === "string"
      ? parseInt(req.query["batchSize"])
      : NaN;

  // If not specified we default to a max of 500 polls
  const batchSize =
    parsedBatchSizeQueryParam > 0 ? parsedBatchSizeQueryParam : 500;

  const { authorization } = req.headers;

  if (authorization !== `Bearer ${process.env.API_SECRET}`) {
    res.status(401).json({ success: false });
    return;
  }

  const pollIds = (
    await prisma.poll.findMany({
      where: {
        OR: [
          {
            deleted: true,
          },
          // demo polls that are 1 day old
          {
            demo: true,
            createdAt: {
              lte: addDays(new Date(), -1),
            },
          },
          // polls that have not been accessed for over 30 days
          {
            touchedAt: {
              lte: addDays(new Date(), -30),
            },
          },
        ],
      },
      select: {
        urlId: true,
      },
      orderBy: {
        createdAt: "asc", // oldest first
      },
      take: batchSize,
    })
  ).map(({ urlId }) => urlId);

  if (pollIds.length !== 0) {
    // Delete links
    await prisma.link.deleteMany({
      where: {
        pollId: {
          in: pollIds,
        },
      },
    });
    // Delete comments
    await prisma.comment.deleteMany({
      where: {
        pollId: {
          in: pollIds,
        },
      },
    });

    await prisma.vote.deleteMany({
      where: {
        pollId: {
          in: pollIds,
        },
      },
    });

    // Delete participants
    await prisma.participant.deleteMany({
      where: {
        pollId: {
          in: pollIds,
        },
      },
    });

    // Delete options
    await prisma.option.deleteMany({
      where: {
        pollId: {
          in: pollIds,
        },
      },
    });

    // Delete polls
    prisma.$executeRaw`DELETE FROM polls WHERE url_id IN (${Prisma.join(
      pollIds,
    )})`;
  }

  res.status(200).json({
    deleted: pollIds,
  });
}
