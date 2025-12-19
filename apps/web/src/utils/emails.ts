import type { SupportedEmailProviders } from "@rallly/emails";
import { EmailClient } from "@rallly/emails";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import * as Sentry from "@sentry/nextjs";

import { env } from "@/env";

export const getEmailClient = (locale?: string) => {
  return new EmailClient({
    provider: {
      name: (process.env.EMAIL_PROVIDER as SupportedEmailProviders) ?? "smtp",
    },
    mail: {
      from: {
        name: env.NOREPLY_EMAIL_NAME,
        address: env.NOREPLY_EMAIL || env.SUPPORT_EMAIL,
      },
    },
    config: {
      logoUrl: env.LOGO_ICON_URL
        ? env.LOGO_ICON_URL
        : "https://d39ixtfgglw55o.cloudfront.net/images/rallly-logo-mark.png",
      baseUrl: absoluteUrl(),
      domain: absoluteUrl().replace(/(^\w+:|^)\/\//, ""),
      supportEmail: env.SUPPORT_EMAIL,
      primaryColor: env.PRIMARY_COLOR,
    },
    locale,
    onError: (e) => {
      console.error(e);
      Sentry.captureException(e);
    },
  });
};
