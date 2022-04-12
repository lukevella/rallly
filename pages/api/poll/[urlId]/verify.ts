import { prisma } from "../../../../db";
import { withLink } from "../../../../utils/api-utils";

export default withLink(async (req, res, link) => {
  if (req.method === "POST") {
    if (link.role !== "admin") {
      return res.status(401).end();
    }
    const { verificationCode } = req.body;
    try {
      await prisma.poll.update({
        where: {
          urlId_verificationCode: {
            urlId: link.pollId,
            verificationCode,
          },
        },
        data: {
          verified: true,
        },
      });
      return res.end();
    } catch {
      console.error(
        `Failed to verify poll "${link.pollId}" with code ${verificationCode}`,
      );
      return res.status(500).end();
    }
  }

  return res.status(405).end();
});
