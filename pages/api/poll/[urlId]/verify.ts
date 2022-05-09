import absoluteUrl from "utils/absolute-url";
import {
  createToken,
  decryptToken,
  mergeGuestsIntoUser as mergeUsersWithGuests,
  withSessionRoute,
} from "utils/auth";

import { prisma } from "../../../../db";
import { sendEmailTemplate, withLink } from "../../../../utils/api-utils";

export default withSessionRoute(
  withLink(async ({ req, res, link }) => {
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
          return res
            .status(404)
            .json({ status: 404, message: "Poll not found" });
        }

        const homePageUrl = absoluteUrl(req).origin;
        const pollUrl = `${homePageUrl}/admin/${link.urlId}`;
        const token = await createToken({
          pollId: link.pollId,
        });
        const verifyEmailUrl = `${pollUrl}?code=${token}`;

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
            supportEmail: process.env.SUPPORT_EMAIL,
          },
        });

        return res.send("ok");
      }
      try {
        const { pollId } = await decryptToken<{
          pollId: string;
        }>(verificationCode);

        if (pollId !== link.pollId) {
          res.status(401).json({
            status: 401,
            message: "Invalid token",
          });
          return;
        }
        const poll = await prisma.poll.update({
          where: {
            urlId: pollId,
          },
          data: {
            verified: true,
          },
          include: { user: true },
        });

        // If logged in as guest, we update all participants
        // and comments by this guest to the user that we just authenticated
        if (req.session.user?.isGuest) {
          await mergeUsersWithGuests(poll.user.id, [req.session.user.id]);
        }

        req.session.user = {
          id: poll.user.id,
          isGuest: false,
          name: poll.user.name,
          email: poll.user.email,
        };
        await req.session.save();

        return res.send("ok");
      } catch (e) {
        console.error(e);
        return res
          .status(500)
          .json({ status: 500, message: "Could not verify poll" });
      }
    }

    return res
      .status(405)
      .json({ status: 405, message: "Invalid http method" });
  }),
);
