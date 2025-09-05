import * as aws from "@aws-sdk/client-ses";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { render } from "@react-email/render";
import { waitUntil } from "@vercel/functions";
import type { Transporter } from "nodemailer";
import { createTransport } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

import { i18nDefaultConfig, i18nInstance } from "./i18n";
import { templates } from "./templates";
import type { TemplateComponent, TemplateName, TemplateProps } from "./types";

type SendEmailOptions<T extends TemplateName> = {
  to: string;
  from?: {
    name: string;
    address: string;
  };
  props: TemplateProps<T>;
  attachments?: Mail.Options["attachments"];
  icalEvent?: Mail.Options["icalEvent"];
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
        // biome-ignore lint/suspicious/noExplicitAny: Fix this later
        {...(options.props as any)}
        ctx={ctx}
      />
    );

    const [html, text] = await Promise.all([
      render(component),
      render(component, { plainText: true }),
    ]);

    try {
      await this.sendEmail({
        from: options.from || this.config.mail.from,
        to: options.to,
        subject,
        html,
        text,
        attachments: options.attachments,
        icalEvent: options.icalEvent,
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
    if (!process.env.SUPPORT_EMAIL) {
      console.info("ℹ SUPPORT_EMAIL not configured - skipping email send");
      return;
    }

    try {
      await this.transport.sendMail({
        ...options,
        from: options.from || this.config.mail.from,
      });
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
        const hasAuth = process.env.SMTP_USER || process.env.SMTP_PWD;
        const port = process.env.SMTP_PORT
          ? Number.parseInt(process.env.SMTP_PORT)
          : undefined;

        const secure = process.env.SMTP_SECURE === "true";

        // Log deprecation warning for legacy variable
        if (process.env.SMTP_TLS_ENABLED === "true") {
          console.warn(
            "⚠️  SMTP_TLS_ENABLED is deprecated and no longer affects certificate validation. Use SMTP_REJECT_UNAUTHORIZED instead.",
          );
        }

        const rejectUnauthorized =
          process.env.SMTP_REJECT_UNAUTHORIZED !== "false";

        // Warn about security change if no explicit setting
        if (
          process.env.SMTP_REJECT_UNAUTHORIZED === undefined &&
          process.env.SMTP_TLS_ENABLED === undefined
        ) {
          console.warn(
            "⚠️  Certificate validation is now enabled by default for SMTP connections. Set SMTP_REJECT_UNAUTHORIZED=true to silence this warning, or SMTP_REJECT_UNAUTHORIZED=false if using self-signed certificates.",
          );
        }

        this.cachedTransport = createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure,
          auth: hasAuth
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PWD,
              }
            : undefined,
          tls: {
            rejectUnauthorized,
          },
        });
        break;
      }
    }

    return this.cachedTransport;
  }
}
