// Public surface of @rallly/emails. The package abstracts react-email,
// nodemailer, and i18n. Send a templated email via the per-template
// `sendXEmail()` functions from `@rallly/emails/templates/<name>`, passing the
// `branding` to use (instance or space). `sendRawEmail` covers plain sends.
export {
  type EmailAttachments,
  type IcalEvent,
  type SendRawEmailOptions,
  sendRawEmail,
} from "./send";
export type { EmailBranding } from "./types";
