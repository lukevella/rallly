import { prisma } from "@rallly/database";
import { NextApiRequest, NextApiResponse } from "next";

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
      AND start > NOW()
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

  res.status(200).json({
    softDeleted: deletedPolls,
  });
}
