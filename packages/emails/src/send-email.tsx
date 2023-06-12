import * as aws from "@aws-sdk/client-ses";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { render } from "@react-email/render";
import { createTransport, Transporter } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
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
  if (transport) {
    // Reuse the transport if it exists
    return transport;
  }

  if (env === "test") {
    transport = createTransport({ port: 4025 });
    return transport;
  }

  switch (process.env.EMAIL_PROVIDER) {
    case "ses":
      {
        const ses = new aws.SES({
          region: process.env["AWS" + "_REGION"],
          credentialDefaultProvider: defaultProvider,
        });

        transport = createTransport({
          SES: {
            ses,
            aws,
            sendingRate: 10,
          },
        });
      }
      break;
    default: {
      const hasAuth = process.env.SMTP_USER || process.env.SMTP_PWD;
      transport = createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT
          ? parseInt(process.env.SMTP_PORT)
          : undefined,
        secure: process.env.SMTP_SECURE === "true",
        auth: hasAuth
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PWD,
            }
          : undefined,
        tls:
          process.env.SMTP_TLS_ENABLED === "true"
            ? {
                ciphers: "SSLv3",
                rejectUnauthorized: false,
              }
            : undefined,
      });
    }
  }

  return transport;
};

type SendEmailOptions<T extends TemplateName> = {
  to: string;
  subject: string;
  props: TemplateProps<T>;
  attachments?: Mail.Options["attachments"];
};

export const sendEmail = async <T extends TemplateName>(
  templateName: T,
  options: SendEmailOptions<T>,
) => {
  if (!process.env.SUPPORT_EMAIL) {
    console.info("SUPPORT_EMAIL not configured - skipping email send");
    return;
  }

  const Template = templates[templateName] as TemplateComponent<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html = render(<Template {...(options.props as any)} />);

  try {
    await sendRawEmail({
      from: {
        name: "Rallly",
        address: process.env.NOREPLY_EMAIL || process.env.SUPPORT_EMAIL,
      },
      to: options.to,
      subject: options.subject,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      html,
      attachments: options.attachments,
    });
  } catch (e) {
    console.error("Error sending email", templateName, e);
  }
};

export const sendRawEmail = async (options: Mail.Options) => {
  const transport = getTransport();
  try {
    await transport.sendMail(options);
    return;
  } catch (e) {
    console.error("Error sending email", e);
  }
};
