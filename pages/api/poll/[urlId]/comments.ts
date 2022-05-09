import { createGuestUser, withSessionRoute } from "utils/auth";

import { prisma } from "../../../../db";
import { sendNotification, withLink } from "../../../../utils/api-utils";

export default withSessionRoute(
  withLink(async ({ req, res, link }) => {
    switch (req.method) {
      case "GET": {
        const comments = await prisma.comment.findMany({
          where: {
            pollId: link.pollId,
          },
          orderBy: [
            {
              createdAt: "asc",
            },
          ],
        });

        return res.json({ comments });
      }
      case "POST": {
        if (!req.session.user) {
          await createGuestUser(req);
        }

        const newComment = await prisma.comment.create({
          data: {
            content: req.body.content,
            pollId: link.pollId,
            authorName: req.body.authorName,
            userId: req.session.user?.isGuest
              ? undefined
              : req.session.user?.id,
            guestId: req.session.user?.isGuest
              ? req.session.user.id
              : undefined,
          },
        });

        await sendNotification(req, link.pollId, {
          type: "newComment",
          authorName: newComment.authorName,
        });

        return res.json(newComment);
      }

      default:
        return res
          .status(405)
          .json({ status: 405, message: "Method not allowed" });
    }
  }),
);
