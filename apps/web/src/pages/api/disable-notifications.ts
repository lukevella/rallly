import { prisma } from "@rallly/database";
import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const pollId = req.query.poll as string;

  if (!pollId) {
    res.status(400).json({ error: "No pollId provided" });
    return;
  }

  const session = await getServerSession(req, res);

  if (!session || session.user.email === null) {
    res.redirect("/api/auth/signin");
    return;
  }

  const watcher = await prisma.watcher.findFirst({
    where: {
      AND: [{ pollId }, { userId: session?.user?.id }],
    },
    select: {
      id: true,
    },
  });

  if (watcher) {
    await prisma.watcher.delete({
      where: {
        id: watcher.id,
      },
    });
  }

  res.redirect(`/poll/${pollId}`);
}
