import { createLogger } from "@rallly/logger";
import { render } from "@react-email/render";
import type Mail from "nodemailer/lib/mailer";

import { getTransport } from "./transport";
import type { EmailBranding } from "./types";

const logger = createLogger("emails");

export type EmailAttachments = Mail.Options["attachments"];
export type IcalEvent = Mail.Options["icalEvent"];
type From = { name: string; address: string };

/** Args every `sendXEmail(...)` accepts. `props` are the template's own fields. */
export type SendArgs<P> = {
  to: string;
  locale?: string;
  branding: EmailBranding;
  props: Omit<P, "locale" | "chrome">;
  from?: From;
  replyTo?: string;
  attachments?: EmailAttachments;
  icalEvent?: IcalEvent;
  /**
   * HTTPS URL that mutes this kind of mail for the recipient. Emitted as
   * `List-Unsubscribe` + `List-Unsubscribe-Post` (RFC 8058 one-click), which
   * Gmail and Yahoo expect on recurring notification mail. The URL must
   * accept an unauthenticated POST.
   */
  listUnsubscribeUrl?: string;
};

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
  listUnsubscribeUrl?: string;
  errorLabel: string;
};

function buildHeaders(
  listUnsubscribeUrl?: string,
): Record<string, string> | undefined {
  if (!listUnsubscribeUrl) {
    return undefined;
  }
  // RFC 8058 one-click requires an https URI. A plain-http instance (local
  // dev, self-hosted on a LAN) still gets the mailto-style link header, just
  // not the one-click flag.
  if (!listUnsubscribeUrl.startsWith("https://")) {
    return { "List-Unsubscribe": `<${listUnsubscribeUrl}>` };
  }
  return {
    "List-Unsubscribe": `<${listUnsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

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
      headers: buildHeaders(options.listUnsubscribeUrl),
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
 * Renders a ready-built React element to html + plain text and dispatches.
 * Each template's `sendXEmail` builds its element (and subject) then calls this.
 */
export async function sendRenderedEmail(options: {
  to: string;
  element: React.ReactNode;
  subject: string;
  from?: From;
  replyTo?: string;
  attachments?: EmailAttachments;
  icalEvent?: IcalEvent;
  listUnsubscribeUrl?: string;
}) {
  const [html, text] = await Promise.all([
    render(options.element),
    render(options.element, { plainText: true }),
  ]);

  await dispatch({
    to: options.to,
    from: options.from,
    replyTo: options.replyTo,
    subject: options.subject,
    html,
    text,
    attachments: options.attachments,
    icalEvent: options.icalEvent,
    listUnsubscribeUrl: options.listUnsubscribeUrl,
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
  listUnsubscribeUrl?: string;
};

/**
 * Sends a plain (non-template) email — subject + text/html, no rendering.
 * For the rare app-specific cases that don't warrant a React template.
 */
export async function sendRawEmail(options: SendRawEmailOptions) {
  await dispatch({ ...options, errorLabel: options.subject });
}
