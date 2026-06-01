import { createLogger } from "@rallly/logger";
import { render } from "@react-email/render";
import type Mail from "nodemailer/lib/mailer";

import { getTransport } from "./transport";
import type { EmailContext } from "./types";

const logger = createLogger("emails");

export type EmailAttachments = Mail.Options["attachments"];
export type IcalEvent = Mail.Options["icalEvent"];
type From = { name: string; address: string };

function resolveFrom(from?: From): From {
  return (
    from ?? {
      name: process.env.NOREPLY_EMAIL_NAME ?? "Rallly",
      address: process.env.NOREPLY_EMAIL || process.env.SUPPORT_EMAIL || "",
    }
  );
}

type DispatchOptions = {
  to: string;
  from?: From;
  replyTo?: string;
  subject?: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachments;
  icalEvent?: IcalEvent;
  errorLabel: string;
};

async function dispatch(options: DispatchOptions) {
  if (!process.env.SUPPORT_EMAIL) {
    logger.info("SUPPORT_EMAIL not configured - skipping email send");
    return;
  }

  try {
    await getTransport().sendMail({
      from: resolveFrom(options.from),
      to: options.to,
      replyTo: options.replyTo,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
      icalEvent: options.icalEvent,
    });
  } catch (e) {
    // Operational (SMTP/transport) failures are logged, not thrown — sending is
    // fire-and-forget. Render/template (code) errors are NOT caught here, so they
    // propagate to the caller's error reporting (Sentry via onRequestError).
    logger.error(
      { error: e, recipient: options.to, subject: options.subject },
      `Failed to send email: ${options.errorLabel}`,
    );
  }
}

/**
 * Internal: render a template component to html + plain text and dispatch.
 * Used by `createEmailTemplate` — not part of the public API.
 */
export async function sendEmail<P extends object>(options: {
  to: string;
  component: (props: P & { ctx: EmailContext }) => React.ReactNode;
  props: P;
  ctx: EmailContext;
  subject: string;
  from?: From;
  attachments?: EmailAttachments;
  icalEvent?: IcalEvent;
}) {
  const Component = options.component as unknown as (
    props: P & { ctx: EmailContext },
  ) => React.ReactNode;
  const element = <Component {...options.props} ctx={options.ctx} />;

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  await dispatch({
    to: options.to,
    from: options.from,
    subject: options.subject,
    html,
    text,
    attachments: options.attachments,
    icalEvent: options.icalEvent,
    errorLabel: options.subject,
  });
}

export type SendRawEmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: From;
  replyTo?: string;
  attachments?: EmailAttachments;
  icalEvent?: IcalEvent;
};

/**
 * Sends a plain (non-template) email — subject + text/html, no rendering.
 * For the rare app-specific cases that don't warrant a React template.
 */
export async function sendRawEmail(options: SendRawEmailOptions) {
  await dispatch({ ...options, errorLabel: options.subject });
}
