import * as aws from "@aws-sdk/client-ses";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { render } from "@react-email/render";
import { createTransport, Transporter } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import React from "react";

import { sendgridTransport } from "nodemailer-sendgrid-transport";
import { mandrillTransport } from "nodemailer-mandrill-transport";
import { mailgunTransport } from "nodemailer-mailgun-transport";
import { sendinblueTransport } from "nodemailer-sendinblue-transport";
import { mailjetTransport } from "nodemailer-mailjet-transport";

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
    case "sendgrid":
      {
        const options = {
            auth: {
                api_key: process.env.SENDGRID_API_KEY
            }
        }

        transport =  nodemailer.createTransport(sendgridTransport(options));
      }
      break;
    case "mandrill":
      {
       const options = {
                        auth: {
                          apiKey: process.env.MANDRILL_API_KEY
                        }
                      }
       transport = nodemailer.createTransport(mandrillTransport(options));
      }
      break;
    case "mailgun":
      {
       const options = {
                         auth: {
                           api_key: process.env.MAILGUN_API_KEY,
                           domain: process.env.MAILGUN_DOMAIN
                         }
                       }

       transport = nodemailer.createTransport(mailgunTransport(options));
      }
      break;
    case "sendinblue":
      {
       const options = {
                        {
                         apiKey: process.env.SENDINBLUE_API_KEY
                        }
                       }

       transporter = nodemailer.createTransport(
           new sendinblueTransport(options)
       );
      }
      break;
    case "mailjet":
      {
       const options = {
                        auth: {
                          apiKey: process.env.MAILJET_API_KEY,
                          apiSecret: process.env.MAILJET_API_SECRET
                        }
                      }

       transporter = nodemailer.createTransport(
           new mailjetTransport(options)
       );
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
      });
    }
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
  if (!process.env.SUPPORT_EMAIL) {
    console.info("SUPPORT_EMAIL not configured - skipping email send");
    return;
  }

  const Template = templates[templateName] as TemplateComponent<T>;

  try {
    await sendRawEmail({
      from: {
        name: "Rallly",
        address: process.env.SUPPORT_EMAIL,
      },
      to: options.to,
      subject: options.subject,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      html: render(<Template {...(options.props as any)} />),
    });
    return;
  } catch (e) {
    console.error("Error sending email", templateName, e);
    options.onError?.();
  }
};

export const sendRawEmail = async (options: Mail.Options) => {
  const transport = getTransport();
  try {
    await transport.sendMail(options);
    return;
  } catch (e) {
    console.error("Error sending email");
  }
};
