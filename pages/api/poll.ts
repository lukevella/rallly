import { sendEmailTemplate } from "utils/api-utils";
import { createToken, withSessionRoute } from "utils/auth";
import { nanoid } from "utils/nanoid";

import { CreatePollPayload } from "../../api-client/create-poll";
import { prisma } from "../../db";
import absoluteUrl from "../../utils/absolute-url";

export default withSessionRoute(async (req, res) => {
  switch (req.method) {
    case "POST": {
      const adminUrlId = await nanoid();
      const payload: CreatePollPayload = req.body;

      const poll = await prisma.poll.create({
        data: {
          urlId: await nanoid(),
          title: payload.title,
          type: payload.type,
          timeZone: payload.timeZone,
          location: payload.location,
          description: payload.description,
          authorName: payload.user.name,
          demo: payload.demo,
          verified:
            req.session.user?.isGuest === false &&
            req.session.user.email === payload.user.email,
          user: {
            connectOrCreate: {
              where: {
                email: payload.user.email,
              },
              create: {
                id: await nanoid(),
                ...payload.user,
              },
            },
          },
          options: {
            createMany: {
              data: payload.options.map((value) => ({
                value,
              })),
            },
          },
          links: {
            createMany: {
              data: [
                {
                  urlId: adminUrlId,
                  role: "admin",
                },
                {
                  urlId: await nanoid(),
                  role: "participant",
                },
              ],
            },
          },
        },
      });

      const homePageUrl = absoluteUrl(req).origin;
      const pollUrl = `${homePageUrl}/admin/${adminUrlId}`;

      try {
        if (poll.verified) {
          await sendEmailTemplate({
            templateName: "new-poll-verified",
            to: payload.user.email,
            subject: `Rallly: ${poll.title}`,
            templateVars: {
              title: poll.title,
              name: payload.user.name,
              pollUrl,
              homePageUrl,
              supportEmail: process.env.SUPPORT_EMAIL,
            },
          });
        } else {
          const verificationCode = await createToken({
            pollId: poll.urlId,
          });
          const verifyEmailUrl = `${pollUrl}?code=${verificationCode}`;

          await sendEmailTemplate({
            templateName: "new-poll",
            to: payload.user.email,
            subject: `Rallly: ${poll.title} - Verify your email address`,
            templateVars: {
              title: poll.title,
              name: payload.user.name,
              pollUrl,
              verifyEmailUrl,
              homePageUrl,
              supportEmail: process.env.SUPPORT_EMAIL,
            },
          });
        }
      } catch (e) {
        console.error(e);
      }

      return res.json({ urlId: adminUrlId, authorName: poll.authorName });
    }
    default:
  }
});
