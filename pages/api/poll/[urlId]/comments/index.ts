import absoluteUrl from "utils/absolute-url";
import { prisma } from "../../../../../db";
import {
  getAdminLink,
  sendEmailTemplate,
  withLink,
} from "../../../../../utils/api-utils";

export default withLink(async (req, res, link) => {
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
      const newComment = await prisma.comment.create({
        data: {
          content: req.body.content,
          pollId: link.pollId,
          authorName: req.body.authorName,
        },
      });

      const poll = await prisma.poll.findUnique({
        where: {
          urlId: link.pollId,
        },
        include: {
          links: true,
          user: true,
        },
      });

      if (poll?.notifications && poll.verified && !poll.demo) {
        // Get the admin link
        const adminLink = getAdminLink(poll.links);

        if (adminLink) {
          const homePageUrl = absoluteUrl(req).origin;
          const pollUrl = `${homePageUrl}/admin/${adminLink.urlId}`;
          const unsubscribeUrl = `${pollUrl}?unsubscribe=true`;

          try {
            await sendEmailTemplate({
              templateName: "new-comment",
              to: poll.user.email,
              subject: `Rallly: ${poll.title} - New Comment`,
              templateVars: {
                title: poll.title,
                name: poll.authorName,
                author: newComment.authorName,
                pollUrl,
                homePageUrl: absoluteUrl(req).origin,
                supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
                unsubscribeUrl,
              },
            });
          } catch (e) {
            console.error(e);
          }
        } else {
          console.log(`Missing admin link for poll: ${link.pollId}`);
        }
      }

      return res.json(newComment);
    }

    default:
      return res
        .status(405)
        .json({ status: 405, message: "Method not allowed" });
  }
});
