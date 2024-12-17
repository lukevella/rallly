import { prisma } from "@rallly/database";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(_req: Request, ctx: { params: { task: string } }) {
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
      return await removeDeletedPolls();
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
async function removeDeletedPolls() {
  const { count: deletedPollCount } = await prisma.poll.deleteMany({
    where: {
      deleted: true,
      deletedAt: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return NextResponse.json({
    success: true,
    summary: {
      deleted: {
        polls: deletedPollCount,
      },
    },
  });
}
