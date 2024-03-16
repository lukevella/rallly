import { prisma } from "@rallly/database";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request, ctx: { params: { task: string } }) {
  const headersList = headers();
  const authorization = headersList.get("authorization");

  if (authorization !== `Bearer ${process.env.API_SECRET}`) {
    return NextResponse.json(
      { success: false },
      {
        status: 401,
      },
    );
  }

  switch (ctx.params.task) {
    case "delete-inactive-polls": {
      return await deleteInactivePolls();
    }
    case "remove-deleted-polls": {
      return await removeDeletedPolls(req);
    }
  }
}

/**
 * Marks inactive polls as deleted. Polls are inactive if they have not been
 * touched in the last 30 days and all dates are in the past.
 */
async function deleteInactivePolls() {
  const markedDeleted = await prisma.$executeRaw`
    UPDATE polls p
    SET
      deleted = true,
      deleted_at = NOW()
    WHERE touched_at < NOW() - INTERVAL '30 days'
    AND deleted = false
    AND id NOT IN (
      SELECT poll_id 
      FROM options 
      WHERE poll_id = p.id
      AND start_time > NOW()
    )
    AND user_id NOT IN (
      SELECT id
      FROM users
      WHERE id IN (
        SELECT user_id 
          FROM user_payment_data 
          WHERE end_date > NOW()
      )
      OR subscription_id IN (
        SELECT subscription_id 
          FROM subscriptions
          WHERE active = true
      )
    );
  `;

  return NextResponse.json({
    success: true,
    summary: {
      markedDeleted,
    },
  });
}

/**
 * Remove polls and corresponding data that have been marked deleted for more than 7 days.
 */
async function removeDeletedPolls(req: Request) {
  const options = (await req.json()) as { take?: number } | undefined;
  // First get the ids of all the polls that have been marked as deleted for at least 7 days
  const deletedPolls = await prisma.poll.findMany({
    select: {
      id: true,
    },
    where: {
      deleted: true,
      deletedAt: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    take: options?.take ?? 1000,
  });

  const deletedPollIds = deletedPolls.map((poll) => poll.id);

  const { count: deletedWatcherCount } = await prisma.watcher.deleteMany({
    where: {
      pollId: {
        in: deletedPollIds,
      },
    },
  });

  const { count: deletedVoteCount } = await prisma.vote.deleteMany({
    where: {
      pollId: {
        in: deletedPollIds,
      },
    },
  });

  const { count: deletedParticipantCount } =
    await prisma.participant.deleteMany({
      where: {
        pollId: {
          in: deletedPollIds,
        },
      },
    });

  const { count: deletedOptionCount } = await prisma.option.deleteMany({
    where: {
      pollId: {
        in: deletedPollIds,
      },
    },
  });

  const { count: deletedCommentCount } = await prisma.comment.deleteMany({
    where: {
      pollId: {
        in: deletedPollIds,
      },
    },
  });

  const { count: deletedPollCount } = await prisma.poll.deleteMany({
    where: {
      id: {
        in: deletedPollIds,
      },
    },
  });

  return NextResponse.json({
    success: true,
    summary: {
      deleted: {
        votes: deletedVoteCount,
        options: deletedOptionCount,
        participants: deletedParticipantCount,
        comments: deletedCommentCount,
        watchers: deletedWatcherCount,
        polls: deletedPollCount,
      },
    },
  });
}
