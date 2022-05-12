import { UpdateParticipantPayload } from "api-client/update-participant";

import { prisma } from "../../../../../db";
import { getQueryParam, withLink } from "../../../../../utils/api-utils";

export default withLink(async ({ req, res, link }) => {
  const participantId = getQueryParam(req, "participantId");

  const pollId = link.pollId;
  switch (req.method) {
    case "PATCH":
      const payload: UpdateParticipantPayload = req.body;

      const participant = await prisma.participant.update({
        where: {
          id_pollId: {
            id: participantId,
            pollId,
          },
        },
        data: {
          votes: {
            deleteMany: {
              pollId,
            },
            createMany: {
              data: payload.votes.map(({ optionId, type }) => ({
                optionId,
                type,
                pollId,
              })),
            },
          },
          name: req.body.name,
        },
        include: {
          votes: true,
        },
      });

      return res.json(participant);

    case "DELETE":
      await prisma.participant.delete({
        where: {
          id_pollId: {
            id: participantId,
            pollId,
          },
        },
      });

      return res.end();
    default:
      return res.status(405);
  }
});
