import * as Eta from "eta";

import { prisma } from "~/prisma/db";
import newCommentTemplate from "~/templates/new-comment";
import newParticipantTemplate from "~/templates/new-participant";

import { absoluteUrl } from "./absolute-url";
import { sendEmail } from "./send-email";

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
            templateString: newParticipantTemplate,
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
            templateString: newCommentTemplate,
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
  templateString: string;
  to: string;
  subject: string;
  templateVars: Record<string, string | undefined>;
}

export const sendEmailTemplate = async ({
  templateString,
  templateVars,
  to,
  subject,
}: SendEmailTemplateParams) => {
  const rendered = await Eta.render(templateString, templateVars);

  if (rendered) {
    await sendEmail({
      html: rendered,
      to,
      subject,
    });
  } else {
    throw new Error(`Failed to render email template`);
  }
};
