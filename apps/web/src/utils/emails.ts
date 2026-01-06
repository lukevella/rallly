import type { SupportedEmailProviders } from "@rallly/emails";
import { EmailClient } from "@rallly/emails";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import * as Sentry from "@sentry/nextjs";

import { env } from "@/env";
import {
  getAppName,
  getLogoIconUrl,
  getPrimaryColor,
  shouldHideAttribution,
} from "@/features/branding/queries";

export const getEmailClient = async (locale?: string) => {
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
      logoUrl: await getLogoIconUrl(),
      baseUrl: absoluteUrl(),
      domain: absoluteUrl().replace(/(^\w+:|^)\/\//, ""),
      supportEmail: env.SUPPORT_EMAIL,
      primaryColor: (await getPrimaryColor()).light,
      appName: getAppName(),
      hideAttribution: await shouldHideAttribution(),
    },
    locale,
    onError: (e) => {
      console.error(e);
      Sentry.captureException(e);
    },
  });
};
