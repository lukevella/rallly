import { stripe } from "@rallly/backend/stripe";
import { prisma } from "@rallly/database";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { absoluteUrl } from "@/utils/absolute-url";
import { getServerSession } from "@/utils/auth";

const inputSchema = z.object({
  session_id: z.string().optional(),
  return_path: z.string().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const userSession = await getServerSession(req, res);

  if (!userSession?.user.email) {
    // You need to be logged in to subscribe
    res
      .status(403)
      .redirect(
        `/login${req.url ? `?redirect=${encodeURIComponent(req.url)}` : ""}`,
      );
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userSession.user.id,
    },
    select: {
      email: true,
      customerId: true,
    },
  });

  if (!user) {
    res.status(403).redirect("/logout");
    return;
  }

  const { session_id: sessionId, return_path } = inputSchema.parse(req.query);

  let customerId: string;

  if (sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    customerId = session.customer as string;
  } else {
    customerId = user.customerId as string;
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: absoluteUrl(return_path),
  });

  res.status(303).redirect(portalSession.url);
}
