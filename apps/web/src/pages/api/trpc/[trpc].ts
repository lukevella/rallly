import { trpcNextApiHandler } from "@rallly/backend/next/trpc/server";
import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession, isEmailBlocked } from "@/utils/auth";
import { isSelfHosted } from "@/utils/constants";
import { emailClient } from "@/utils/emails";

export const config = {
  api: {
    externalResolver: true,
  },
};

// export API handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res);

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  return trpcNextApiHandler({
    user: {
      isGuest: session.user.email === null,
      id: session.user.id,
    },
    emailClient,
    isSelfHosted,
    isEmailBlocked,
  })(req, res);
}
