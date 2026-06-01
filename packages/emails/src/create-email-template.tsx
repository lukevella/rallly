import { absoluteUrl } from "@rallly/utils/absolute-url";

import { createEmailI18n } from "./i18n";
import type { EmailAttachments, IcalEvent } from "./send";
import { sendEmail } from "./send";
import type { EmailBranding, EmailContext } from "./types";

type From = { name: string; address: string };

type TemplateProps<C> = C extends (props: infer P) => React.ReactNode
  ? Omit<P, "ctx">
  : never;

type SendArgs<C> = {
  to: string;
  locale?: string;
  branding: EmailBranding;
  props: TemplateProps<C>;
  from?: From;
  attachments?: EmailAttachments;
  icalEvent?: IcalEvent;
};

/**
 * Defines a sendable email from a template component + subject. Returns a single
 * `send` function: the caller passes `branding` (instance or space) and `props`,
 * and the package resolves env constants, assembles i18n, renders, and dispatches.
 * No awareness of react-email/nodemailer/i18n leaks to callers.
 */
export function createEmailTemplate<
  C extends (props: never) => React.ReactNode,
>(definition: {
  component: C;
  subject: (props: TemplateProps<C>, ctx: EmailContext) => string;
}) {
  return async function send(args: SendArgs<C>) {
    const url = absoluteUrl();
    const { i18n, t } = await createEmailI18n(args.locale ?? "en");
    const ctx: EmailContext = {
      ...args.branding,
      baseUrl: url,
      domain: url.replace(/(^\w+:|^)\/\//, ""),
      supportEmail: process.env.SUPPORT_EMAIL ?? "",
      i18n,
      t,
      i18nProps: { i18n, t, ns: "emails" },
    };

    return sendEmail({
      to: args.to,
      component: definition.component as unknown as (
        props: TemplateProps<C> & { ctx: EmailContext },
      ) => React.ReactNode,
      props: args.props,
      ctx,
      subject: definition.subject(args.props, ctx),
      from: args.from,
      attachments: args.attachments,
      icalEvent: args.icalEvent,
    });
  };
}
