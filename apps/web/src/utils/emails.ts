import type { SupportedEmailProviders } from "@rallly/emails";
import { EmailClient } from "@rallly/emails";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import * as Sentry from "@sentry/nextjs";

import { env } from "@/env";
import { getAppName, getBrandingConfig } from "@/features/branding/queries";

export const getEmailClient = async (locale?: string) => {
  const brandingConfig = await getBrandingConfig();

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
      logoUrl: brandingConfig.logoIcon,
      baseUrl: absoluteUrl(),
      domain: absoluteUrl().replace(/(^\w+:|^)\/\//, ""),
      supportEmail: env.SUPPORT_EMAIL,
      primaryColor: brandingConfig.primaryColor.light,
      appName: getAppName(),
      hideAttribution: brandingConfig.hideAttribution,
    },
    locale,
    onError: (e) => {
      console.error(e);
      Sentry.captureException(e);
    },
  });
};
