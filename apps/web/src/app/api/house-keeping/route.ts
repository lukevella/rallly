import { prisma } from "@rallly/database";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type DeleteInactivePolls = {
  type: "deleteInactivePolls";
};

type RemoveDeletedPolls = {
  type: "removeDeletedPolls";
  take?: number;
};

type HouseKeepingAction = DeleteInactivePolls | RemoveDeletedPolls;

export async function POST(req: Request) {
  const headersList = headers();
  const authorization = headersList.get("authorization");

  if (authorization !== `Bearer ${process.env.API_SECRET}`) {
    NextResponse.json(
      { success: false },
      {
        status: 401,
      },
    );
    return;
  }

  const data = (await req.json()) as HouseKeepingAction;

  switch (data.type) {
    case "deleteInactivePolls": {
      const count = await deleteInactivePolls();
      return NextResponse.json({ success: true, count });
    }
    case "removeDeletedPolls": {
      const res = await removeDeletedPolls();
      return NextResponse.json({ success: true, res });
    }
  }
}

async function deleteInactivePolls() {
  const deletedPolls = await prisma.$executeRaw`
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

  return deletedPolls;
}

/**
 * Delete polls and corresponding options, votes and comments that have been marked deleted
 * for more than 7 days.
 */
async function removeDeletedPolls() {
  // First get the ids of all the polls that are to be deleted, limit to 1000
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
    take: 1000,
  });

  const deletedPollIds = deletedPolls.map((poll) => poll.id);

  const { count: deletedVoteCount } = await prisma.vote.deleteMany({
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

  const { count: deletedWatcherCount } = await prisma.watcher.deleteMany({
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

  return {
    deleted: {
      votes: deletedVoteCount,
      options: deletedOptionCount,
      comments: deletedCommentCount,
      watchers: deletedWatcherCount,
      polls: deletedPollCount,
    },
  };
}
