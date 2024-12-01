import type { TFunction } from "i18next";

import type { I18nInstance } from "./i18n";
import type { EmailTemplates } from "./templates";

export type EmailContext = {
  logoUrl: string;
  baseUrl: string;
  domain: string;
  supportEmail: string;
  i18n: I18nInstance;
  t: TFunction<"emails", undefined, "emails">;
};

export type TemplateName = keyof EmailTemplates;

export type TemplateProps<T extends TemplateName> = Omit<
  React.ComponentProps<EmailTemplates[T]>,
  "ctx"
>;

export type TemplateComponent<T extends TemplateName> = EmailTemplates[T] & {
  getSubject?: (props: TemplateProps<T>, ctx: EmailContext) => string;
};
