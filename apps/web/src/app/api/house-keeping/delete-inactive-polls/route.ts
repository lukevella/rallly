import { prisma } from "@rallly/database";
import { NextResponse } from "next/server";

import { checkApiAuthorization } from "@/utils/api-auth";

/**
 * Marks inactive polls as deleted. Polls are inactive if they have not been
 * touched in the last 30 days and all dates are in the past.
 */
export async function POST() {
  const unauthorized = checkApiAuthorization();
  if (unauthorized) return unauthorized;

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
