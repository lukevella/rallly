import { Link } from "@prisma/client";
import * as Eta from "eta";
import { readFileSync } from "fs";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import path from "path";

import { prisma } from "../db";
import { sendEmail } from "./send-email";

export const exclude = <O extends Record<string, any>, E extends keyof O>(
  obj: O,
  ...fieldsToExclude: E[]
): Omit<O, E> => {
  const newObj = { ...obj };
  fieldsToExclude.forEach((field) => {
    delete newObj[field];
  });
  return newObj;
};

export const getQueryParam = (req: NextApiRequest, queryKey: string) => {
  const value = req.query[queryKey];
  return typeof value === "string" ? value : value[0];
};

export const withLink = (
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    link: Link,
  ) => Promise<void>,
): NextApiHandler => {
  return async (req, res) => {
    const urlId = getQueryParam(req, "urlId");
    const link = await prisma.link.findUnique({ where: { urlId } });

    if (!link) {
      const message = `Could not find link with urlId: ${urlId}`;
      return res.status(404).json({
        status: 404,
        message,
      });
    }

    return await handler(req, res, link);
  };
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
