import { render } from "@react-email/render";
import { createTransport, Transporter } from "nodemailer";
import React from "react";

import * as templates from "./templates";

type Templates = typeof templates;

type TemplateName = keyof typeof templates;

type TemplateProps<T extends TemplateName> = React.ComponentProps<
  TemplateComponent<T>
>;

type TemplateComponent<T extends TemplateName> = Templates[T];

const env = process.env["NODE" + "_ENV"] || "development";

let transport: Transporter;

const getTransport = () => {
  if (env === "test") {
    transport = createTransport({ port: 4025 });
  } else {
    transport = createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PWD,
      },
    });
  }
  return transport;
};

type SendEmailOptions<T extends TemplateName> = {
  to: string;
  subject: string;
  props: TemplateProps<T>;
  onError?: () => void;
};

export const sendEmail = async <T extends TemplateName>(
  templateName: T,
  options: SendEmailOptions<T>,
) => {
  const transport = getTransport();
  const Template = templates[templateName] as TemplateComponent<T>;

  try {
    return await transport.sendMail({
      from: process.env.SUPPORT_EMAIL,
      to: options.to,
      subject: options.subject,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      html: render(<Template {...(options.props as any)} />),
    });
  } catch (e) {
    console.error("Error sending email", templateName);
    options.onError?.();
  }
};
