import * as aws from "@aws-sdk/client-ses";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { render } from "@react-email/render";
import { createTransport, Transporter } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import previewEmail from "preview-email";
import React from "react";

import * as templates from "./templates";

type Templates = typeof templates;

type TemplateName = keyof typeof templates;

type TemplateProps<T extends TemplateName> = React.ComponentProps<
  TemplateComponent<T>
>;

type TemplateComponent<T extends TemplateName> = Templates[T];

type SendEmailOptions<T extends TemplateName> = {
  to: string;
  subject: string;
  props: TemplateProps<T>;
  attachments?: Mail.Options["attachments"];
};

type EmailProviderConfig =
  | {
      name: "ses";
      // config defined through env vars
    }
  | {
      name: "smtp";
      // config defined through env vars
    };

export type SupportedEmailProviders = EmailProviderConfig["name"];

type EmailClientConfig = {
  /**
   * Whether to open previews of each email in the browser
   */
  openPreviews?: boolean;
  /**
   * Whether to send emails to the test server
   */
  useTestServer: boolean;
  /**
   * Email provider config
   */
  provider: EmailProviderConfig;
  /**
   * Mail config
   */
  mail: {
    from: {
      name: string;
      address: string;
    };
  };
};

export class EmailClient {
  private config: EmailClientConfig;
  private cachedTransport?: Transporter;

  constructor(config: EmailClientConfig) {
    this.config = config;
  }

  async sendTemplate<T extends TemplateName>(
    templateName: T,
    options: SendEmailOptions<T>,
  ) {
    if (!process.env.SUPPORT_EMAIL) {
      console.info("SUPPORT_EMAIL not configured - skipping email send");
      return;
    }

    const Template = templates[templateName] as TemplateComponent<T>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html = render(<Template {...(options.props as any)} />);

    try {
      await this.sendEmail({
        from: this.config.mail.from,
        to: options.to,
        subject: options.subject,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        html,
        attachments: options.attachments,
      });
    } catch (e) {
      console.error("Error sending email", templateName, e);
    }
  }

  async sendEmail(options: Mail.Options) {
    if (this.config.openPreviews) {
      previewEmail(options, {
        openSimulator: false,
      });
    }

    try {
      await this.transport.sendMail(options);
      return;
    } catch (e) {
      console.error("Error sending email", e);
    }
  }

  private get transport() {
    if (this.cachedTransport) {
      // Reuse the transport if it exists
      return this.cachedTransport;
    }

    if (this.config.useTestServer) {
      this.cachedTransport = createTransport({
        port: 4025,
      });
      return this.cachedTransport;
    }

    switch (this.config.provider.name) {
      case "ses": {
        const ses = new aws.SES({
          region: process.env["AWS" + "_REGION"],
          credentialDefaultProvider: defaultProvider,
        });

        this.cachedTransport = createTransport({
          SES: {
            ses,
            aws,
            sendingRate: 10,
          },
        });
        break;
      }
      case "smtp": {
        const hasAuth = process.env.SMTP_USER || process.env.SMTP_PWD;
        this.cachedTransport = createTransport({
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
        break;
      }
    }

    return this.cachedTransport;
  }
}
