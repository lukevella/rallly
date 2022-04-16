import { prisma } from "../../../../../db";
import { getQueryParam,withLink } from "../../../../../utils/api-utils";

export default withLink(async (req, res, link) => {
  const participantId = getQueryParam(req, "participantId");

  const pollId = link.pollId;
  switch (req.method) {
    case "PATCH":
      await prisma.participant.update({
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
              data: req.body.votes.map((optionId: string) => ({
                optionId,
                pollId,
              })),
            },
          },
          name: req.body.name,
        },
      });

      return res.end();

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
  }
});
