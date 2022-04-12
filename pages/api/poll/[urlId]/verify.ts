import absoluteUrl from "utils/absolute-url";
import { prisma } from "../../../../db";
import { sendEmailTemplate, withLink } from "../../../../utils/api-utils";

export default withLink(async (req, res, link) => {
  if (req.method === "POST") {
    if (link.role !== "admin") {
      return res
        .status(401)
        .json({ status: 401, message: "Only admins can verify polls" });
    }
    const verificationCode = req.body ? req.body.verificationCode : undefined;
    if (!verificationCode) {
      const poll = await prisma.poll.findUnique({
        where: {
          urlId: link.pollId,
        },
        include: {
          user: true,
        },
      });

      if (!poll) {
        return res.status(404).json({ status: 404, message: "Poll not found" });
      }

      const homePageUrl = absoluteUrl(req).origin;
      const pollUrl = `${homePageUrl}/admin/${link.urlId}`;
      const verifyEmailUrl = `${pollUrl}?code=${poll.verificationCode}`;

      await sendEmailTemplate({
        templateName: "new-poll",
        to: poll.user.email,
        subject: `Rallly: ${poll.title} - Verify your email address`,
        templateVars: {
          title: poll.title,
          name: poll.user.name,
          pollUrl,
          verifyEmailUrl,
          homePageUrl,
          supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
        },
      });

      return res.send("ok");
    }
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
      return res.send("ok");
    } catch {
      console.error(
        `Failed to verify poll "${link.pollId}" with code ${verificationCode}`,
      );
      return res
        .status(500)
        .json({ status: 500, message: "Could not verify poll" });
    }
  }

  return res.status(405).json({ status: 405, message: "Invalid http method" });
});
