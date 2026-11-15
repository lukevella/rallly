import { Head, Hr, Html, Img, Preview } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { resolveChrome } from "../chrome";
import { ApiPollUsage } from "../components/api-poll-usage";
import { PoweredBy } from "../components/powered-by";
import { previewChrome } from "../components/preview-chrome";
import {
  Body,
  Button,
  Container,
  Heading,
  Text,
} from "../components/styled-components";
import { createEmailI18n } from "../i18n";
import type { SendArgs } from "../send";
import { sendRenderedEmail } from "../send";
import type { EmailChrome } from "../types";

export type ApiPollNearLimitEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  spaceName: string;
  used: number;
  limit: number;
  /** When the count resets, formatted for the locale. */
  resetDate: string;
  /** How far away the reset is, e.g. "in 3 weeks", formatted for the locale. */
  resetIn: string;
  settingsUrl: string;
};

async function ApiPollNearLimitEmail({
  locale = "en",
  chrome,
  spaceName,
  used,
  limit,
  resetDate,
  resetIn,
  settingsUrl,
}: ApiPollNearLimitEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("apiPollNearLimit_preview", {
          defaultValue:
            "{spaceName} has used {used} of its {limit} API polls this month",
          spaceName,
          used,
          limit,
        })}
      </Preview>
      <Body>
        <Container>
          <Img
            src={chrome.logoUrl}
            height="42"
            style={{ marginBottom: 32, borderRadius: 6 }}
            alt={chrome.appName}
          />
          <Heading>
            {t("apiPollNearLimit_heading", {
              defaultValue: "You're close to your API poll limit",
            })}
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="apiPollNearLimit_usage"
              defaults="<b>{spaceName}</b> has created {used} of its {limit} polls through the API this month."
              values={{ spaceName, used, limit }}
              components={{ b: <strong /> }}
            />
          </Text>
          <ApiPollUsage
            locale={locale}
            used={used}
            limit={limit}
            color="#F59E0B"
            resetIn={resetIn}
            resetDate={resetDate}
          />
          <Text>
            {t("apiPollNearLimit_body", {
              defaultValue:
                "Once you reach the limit, new polls created through the API will be rejected until the count resets. Need a higher limit? The API add-on raises it every month.",
            })}
          </Text>
          <Button href={settingsUrl} color={chrome.primaryColor}>
            {t("apiPollNearLimit_button", {
              defaultValue: "Increase your limit",
            })}
          </Button>
          <Hr style={{ margin: "16px 0" }} />
          <PoweredBy chrome={chrome} locale={locale} />
        </Container>
      </Body>
    </Html>
  );
}

ApiPollNearLimitEmail.PreviewProps = {
  locale: "en",
  chrome: previewChrome,
  spaceName: "My Team",
  used: 40,
  limit: 50,
  resetDate: "December 1, 2026",
  resetIn: "in 3 weeks",
  settingsUrl: "https://app.rallly.co/settings/api-keys",
} as ApiPollNearLimitEmailProps;

export default ApiPollNearLimitEmail;

/** Resolves false when the transport failed, so the queue can retry. */
export async function sendApiPollNearLimitEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<ApiPollNearLimitEmailProps>) {
  const { t } = await createEmailI18n(locale);
  return sendRenderedEmail({
    to,
    subject: t("apiPollNearLimit_subject", {
      defaultValue: "{spaceName} is close to its API poll limit",
      spaceName: props.spaceName,
    }),
    element: (
      <ApiPollNearLimitEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
