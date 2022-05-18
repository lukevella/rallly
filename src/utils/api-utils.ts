import { Link } from "@prisma/client";
import * as Eta from "eta";
import { readFileSync } from "fs";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import path from "path";

import { prisma } from "~/prisma/db";
import { absoluteUrl } from "./absolute-url";
import { sendEmail } from "./send-email";

export const getQueryParam = (req: NextApiRequest, queryKey: string) => {
  const value = req.query[queryKey];
  return typeof value === "string" ? value : value[0];
};

type ApiMiddleware<T, P extends Record<string, unknown>> = (
  ctx: {
    req: NextApiRequest;
    res: NextApiResponse<T>;
  } & P,
) => Promise<void | NextApiResponse>;

/**
 * Gets the Link from `req.query.urlId` and passes it to handler
 * @param handler
 * @returns
 */
export const withLink = <T>(
  handler: ApiMiddleware<T, { link: Link }>,
): NextApiHandler => {
  return async (req, res) => {
    const urlId = getQueryParam(req, "urlId");
    const link = await prisma.link.findUnique({ where: { urlId } });

    if (!link) {
      res.status(404).json({
        status: 404,
        message: `Could not find link with urlId: ${urlId}`,
      });
      return;
    }

    await handler({ req, res, link });
    return;
  };
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
      where: { urlId: pollId },
      include: { user: true, links: true },
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
      const adminLink = getAdminLink(poll.links);
      if (!adminLink) {
        throw new Error(`Missing admin link for poll: ${pollId}`);
      }
      const homePageUrl = absoluteUrl();
      const pollUrl = `${homePageUrl}/admin/${adminLink.urlId}`;
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

export const getAdminLink = (links: Link[]) =>
  links.find((link) => link.role === "admin");

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
