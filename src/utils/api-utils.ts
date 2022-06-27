import * as Eta from "eta";
import { readFileSync } from "fs";
import { NextApiRequest } from "next";
import path from "path";

import { prisma } from "~/prisma/db";

import { absoluteUrl } from "./absolute-url";
import { sendEmail } from "./send-email";

export const getQueryParam = (req: NextApiRequest, queryKey: string) => {
  const value = req.query[queryKey];
  return typeof value === "string" ? value : value[0];
};

type NotificationAction =
  | {
      type: "newParticipant";
      participantName: string;
    }
  | {
      type: "newComment";
      authorName: string;
    };

export const sendNotification = async (
  pollId: string,
  action: NotificationAction,
): Promise<void> => {
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { user: true },
    });
    /**
     * poll needs to:
     * - exist
     * - be verified
     * - not be a demo
     * - have notifications turned on
     */
    if (
      poll &&
      poll?.user.email &&
      poll.verified &&
      !poll.demo &&
      poll.notifications
    ) {
      const homePageUrl = absoluteUrl();
      const pollUrl = `${homePageUrl}/admin/${poll.adminUrlId}`;
      const unsubscribeUrl = `${pollUrl}?unsubscribe=true`;

      switch (action.type) {
        case "newParticipant":
          await sendEmailTemplate({
            templateName: "new-participant",
            to: poll.user.email,
            subject: `Rallly: ${poll.title} - New Participant`,
            templateVars: {
              title: poll.title,
              name: poll.authorName,
              participantName: action.participantName,
              pollUrl,
              homePageUrl: absoluteUrl(),
              supportEmail: process.env.SUPPORT_EMAIL,
              unsubscribeUrl,
            },
          });
          break;
        case "newComment":
          await sendEmailTemplate({
            templateName: "new-comment",
            to: poll.user.email,
            subject: `Rallly: ${poll.title} - New Comment`,
            templateVars: {
              title: poll.title,
              name: poll.authorName,
              author: action.authorName,
              pollUrl,
              homePageUrl: absoluteUrl(),
              supportEmail: process.env.SUPPORT_EMAIL,
              unsubscribeUrl,
            },
          });
          break;
      }
    }
  } catch (e) {
    console.error(e);
  }
};

interface SendEmailTemplateParams {
  templateName: string;
  to: string;
  subject: string;
  templateVars: Record<string, string | undefined>;
}

export const sendEmailTemplate = async ({
  templateName,
  templateVars,
  to,
  subject,
}: SendEmailTemplateParams) => {
  const template = readFileSync(
    path.resolve(process.cwd(), `./templates/${templateName}.html`),
  ).toString();

  const rendered = await Eta.render(template, templateVars);

  if (rendered) {
    await sendEmail({
      html: rendered,
      to,
      subject,
    });
  } else {
    throw new Error(`Failed to render email template: ${templateName}`);
  }
};
