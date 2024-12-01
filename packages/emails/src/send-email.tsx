import * as aws from "@aws-sdk/client-ses";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { renderAsync } from "@react-email/render";
import { waitUntil } from "@vercel/functions";
import type { Transporter } from "nodemailer";
import { createTransport } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

import { i18nDefaultConfig, i18nInstance } from "./i18n";
import { templates } from "./templates";
import type { TemplateComponent, TemplateName, TemplateProps } from "./types";

type SendEmailOptions<T extends TemplateName> = {
  to: string;
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
  /**
   * Context to pass to each email
   */
  config: {
    logoUrl: string;
    baseUrl: string;
    domain: string;
    supportEmail: string;
  };

  locale?: string;
  onError?: (error: Error) => void;
};

export class EmailClient {
  private config: EmailClientConfig;
  private cachedTransport?: Transporter;

  constructor(config: EmailClientConfig) {
    this.config = config;
  }

  queueTemplate<T extends TemplateName>(
    templateName: T,
    options: SendEmailOptions<T>,
  ) {
    const promise = this.sendTemplate(templateName, options);
    waitUntil(promise);
  }

  async sendTemplate<T extends TemplateName>(
    templateName: T,
    options: SendEmailOptions<T>,
  ) {
    const locale = this.config.locale ?? "en";

    await i18nInstance.init({
      ...i18nDefaultConfig,
      lng: locale,
    });

    const ctx = {
      ...this.config.config,
      i18n: i18nInstance,
      t: i18nInstance.getFixedT(locale),
    };

    const Template = templates[templateName] as TemplateComponent<T>;
    const subject = Template.getSubject?.(options.props, ctx);
    const component = (
      <Template
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(options.props as any)}
        ctx={ctx}
      />
    );

    const [html, text] = await Promise.all([
      renderAsync(component),
      renderAsync(component, { plainText: true }),
    ]);

    try {
      await this.sendEmail({
        from: this.config.mail.from,
        to: options.to,
        subject,
        html,
        text,
        attachments: options.attachments,
      });
    } catch (e) {
      const enhancedError = new Error(
        `Failed to send email template: ${templateName}`,
        {
          cause: e instanceof Error ? e : new Error(String(e)),
        },
      );
      Object.assign(enhancedError, {
        templateName,
        recipient: options.to,
        subject,
      });
      this.config.onError?.(enhancedError);
    }
  }

  async sendEmail(options: Mail.Options) {
    if (!process.env["SUPPORT_EMAIL"]) {
      console.info("ℹ SUPPORT_EMAIL not configured - skipping email send");
      return;
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

    switch (this.config.provider.name) {
      case "ses": {
        const ses = new aws.SES({
          region: process.env["AWS" + "_REGION"] as string,
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
        const hasAuth = process.env["SMTP_USER"] || process.env["SMTP_PWD"];
        this.cachedTransport = createTransport({
          host: process.env["SMTP_HOST"],
          port: process.env["SMTP_PORT"]
            ? parseInt(process.env["SMTP_PORT"])
            : undefined,
          secure: process.env["SMTP_SECURE"] === "true",
          auth: hasAuth
            ? {
                user: process.env["SMTP_USER"],
                pass: process.env["SMTP_PWD"],
              }
            : undefined,
          tls: {
            rejectUnauthorized: process.env["SMTP_TLS_ENABLED"] === "true",
          },
        });
        break;
      }
    }

    return this.cachedTransport;
  }
}
