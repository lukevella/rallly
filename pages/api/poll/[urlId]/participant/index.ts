import { createGuestUser, withSessionRoute } from "utils/auth";

import { AddParticipantPayload } from "../../../../../api-client/add-participant";
import { prisma } from "../../../../../db";
import { sendNotification, withLink } from "../../../../../utils/api-utils";

export default withSessionRoute(
  withLink(async ({ req, res, link }) => {
    switch (req.method) {
      case "POST": {
        const payload: AddParticipantPayload = req.body;

        if (!req.session.user) {
          await createGuestUser(req);
        }

        const participant = await prisma.participant.create({
          data: {
            pollId: link.pollId,
            name: payload.name,
            userId:
              req.session.user?.isGuest === false
                ? req.session.user.id
                : undefined,
            guestId:
              req.session.user?.isGuest === true
                ? req.session.user.id
                : undefined,
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

        await sendNotification(req, link.pollId, {
          type: "newParticipant",
          participantName: participant.name,
        });

        return res.json(participant);
      }
      default:
        return res.status(405).json({ ok: 1 });
    }
  }),
);
