import { prisma } from "@rallly/database";
import { sendEmail } from "@rallly/emails";
import * as Eta from "eta";

import { sendEmail as sendEmailOld } from "@/utils/send-email";

import { absoluteUrl } from "./absolute-url";

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
      select: {
        verified: true,
        demo: true,
        notifications: true,
        adminUrlId: true,
        title: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
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
          await sendEmail("NewParticipantEmail", {
            to: poll.user.email,
            subject: `New participant on ${poll.title}`,
            props: {
              name: poll.user.name,
              participantName: action.participantName,
              pollUrl,
              unsubscribeUrl,
              title: poll.title,
            },
          });
          break;
        case "newComment":
          await sendEmail("NewCommentEmail", {
            to: poll.user.email,
            subject: `New comment on ${poll.title}`,
            props: {
              name: poll.user.name,
              authorName: action.authorName,
              pollUrl,
              unsubscribeUrl,
              title: poll.title,
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
  const rendered = Eta.render(templateString, templateVars);

  if (rendered) {
    await sendEmailOld({
      html: rendered,
      to,
      subject,
    });
  } else {
    throw new Error(`Failed to render email template`);
  }
};
