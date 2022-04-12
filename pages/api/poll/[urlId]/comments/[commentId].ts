import { NextApiRequest, NextApiResponse } from "next";

import { prisma } from "../../../../../db";
import { getQueryParam } from "../../../../../utils/api-utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const urlId = getQueryParam(req, "urlId");
  const commentId = getQueryParam(req, "commentId");

  const link = await prisma.link.findUnique({ where: { urlId } });

  if (!link) {
    return res.status(404).end();
  }

  switch (req.method) {
    case "DELETE":
      await prisma.comment.delete({
        where: {
          id_pollId: {
            id: commentId,
            pollId: link.pollId,
          },
        },
      });

      return res.end();
    default:
      return res
        .status(405)
        .json({ status: 405, message: "Method not allowed" });
  }
}
