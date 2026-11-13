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

export type ApiPollAtLimitEmailProps = {
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

async function ApiPollAtLimitEmail({
  locale = "en",
  chrome,
  spaceName,
  used,
  limit,
  resetDate,
  resetIn,
  settingsUrl,
}: ApiPollAtLimitEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("apiPollAtLimit_preview", {
          defaultValue:
            "{spaceName} can't create more polls through the API until {resetDate}",
          spaceName,
          resetDate,
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
            {t("apiPollAtLimit_heading", {
              defaultValue: "You've reached your API poll limit",
            })}
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="apiPollAtLimit_usage"
              defaults="<b>{spaceName}</b> has created {used} of its {limit} polls through the API this month."
              values={{ spaceName, used, limit }}
              components={{ b: <strong /> }}
            />
          </Text>
          <ApiPollUsage
            locale={locale}
            used={used}
            limit={limit}
            color="#DC2626"
            resetIn={resetIn}
            resetDate={resetDate}
          />
          <Text>
            {t("apiPollAtLimit_body", {
              defaultValue:
                "New polls created through the API are being rejected. Raise your monthly limit with the API add-on to resume right away, or wait until the count resets. Polls created in Rallly are not affected.",
            })}
          </Text>
          <Button href={settingsUrl} color={chrome.primaryColor}>
            {t("apiPollAtLimit_button", {
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

ApiPollAtLimitEmail.PreviewProps = {
  locale: "en",
  chrome: previewChrome,
  spaceName: "My Team",
  used: 50,
  limit: 50,
  resetDate: "December 1, 2026",
  resetIn: "in 3 weeks",
  settingsUrl: "https://app.rallly.co/settings/api-keys",
} as ApiPollAtLimitEmailProps;

export default ApiPollAtLimitEmail;

/** Resolves false when the transport failed, so the queue can retry. */
export async function sendApiPollAtLimitEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<ApiPollAtLimitEmailProps>) {
  const { t } = await createEmailI18n(locale);
  return sendRenderedEmail({
    to,
    subject: t("apiPollAtLimit_subject", {
      defaultValue: "{spaceName} has reached its API poll limit",
      spaceName: props.spaceName,
    }),
    element: (
      <ApiPollAtLimitEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
