import absoluteUrl from "utils/absolute-url";
import { AddParticipantPayload } from "../../../../../api-client/add-participant";
import { prisma } from "../../../../../db";
import {
  getAdminLink,
  sendEmailTemplate,
  withLink,
} from "../../../../../utils/api-utils";

export default withLink(async (req, res, link) => {
  switch (req.method) {
    case "POST": {
      const payload: AddParticipantPayload = req.body;

      const participant = await prisma.participant.create({
        data: {
          pollId: link.pollId,
          name: payload.name,
          votes: {
            createMany: {
              data: payload.votes.map((optionId) => ({
                optionId,
                pollId: link.pollId,
              })),
            },
          },
        },
        include: {
          votes: true,
        },
      });

      const poll = await prisma.poll.findUnique({
        where: {
          urlId: link.pollId,
        },
        include: {
          user: true,
          links: true,
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
              templateName: "new-participant",
              to: poll.user.email,
              subject: `Rallly: ${poll.title} - New Participant`,
              templateVars: {
                title: poll.title,
                name: poll.authorName,
                participantName: participant.name,
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
          console.error(`Missing admin link for poll: ${link.pollId}`);
        }
      }

      return res.json(participant);
    }
    default:
      return res.status(405).json({ ok: 1 });
  }
});
