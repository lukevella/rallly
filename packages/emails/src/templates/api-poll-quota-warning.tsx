import { Head, Hr, Html, Img, Preview } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { resolveChrome } from "../chrome";
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

export type ApiPollQuotaWarningEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  level: "near_limit" | "at_limit";
  spaceName: string;
  used: number;
  limit: number;
  /** The UTC date the count resets, already formatted for the locale. */
  resetDate: string;
  settingsUrl: string;
};

async function ApiPollQuotaWarningEmail({
  locale = "en",
  chrome,
  level,
  spaceName,
  used,
  limit,
  resetDate,
  settingsUrl,
}: ApiPollQuotaWarningEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  const atLimit = level === "at_limit";
  return (
    <Html>
      <Head />
      <Preview>
        {atLimit
          ? t("apiPollQuotaWarning_atLimitPreview", {
              defaultValue:
                "{spaceName} can't create more polls through the API until {resetDate}",
              spaceName,
              resetDate,
            })
          : t("apiPollQuotaWarning_nearLimitPreview", {
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
            {atLimit
              ? t("apiPollQuotaWarning_atLimitHeading", {
                  defaultValue: "You've reached your API poll limit",
                })
              : t("apiPollQuotaWarning_nearLimitHeading", {
                  defaultValue: "You're close to your API poll limit",
                })}
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="apiPollQuotaWarning_usage"
              defaults="<b>{spaceName}</b> has created {used} of its {limit} polls through the API this month."
              values={{ spaceName, used, limit }}
              components={{ b: <strong /> }}
            />
          </Text>
          <Text>
            {atLimit
              ? t("apiPollQuotaWarning_atLimitReset", {
                  defaultValue:
                    "New polls created through the API will be rejected until the count resets on {resetDate} (UTC). Polls created in Rallly are not affected.",
                  resetDate,
                })
              : t("apiPollQuotaWarning_nearLimitReset", {
                  defaultValue:
                    "The count resets on {resetDate} (UTC). Once the limit is reached, new polls created through the API will be rejected until then.",
                  resetDate,
                })}
          </Text>
          <Button href={settingsUrl} color={chrome.primaryColor}>
            {t("apiPollQuotaWarning_button", {
              defaultValue: "View API usage",
            })}
          </Button>
          <Hr style={{ margin: "16px 0" }} />
          <PoweredBy chrome={chrome} locale={locale} />
        </Container>
      </Body>
    </Html>
  );
}

ApiPollQuotaWarningEmail.PreviewProps = {
  locale: "en",
  chrome: previewChrome,
  level: "near_limit",
  spaceName: "My Team",
  used: 40,
  limit: 50,
  resetDate: "December 1, 2026",
  settingsUrl: "https://app.rallly.co/settings/api-keys",
} as ApiPollQuotaWarningEmailProps;

export default ApiPollQuotaWarningEmail;

/** Resolves false when the transport failed, so the queue can retry. */
export async function sendApiPollQuotaWarningEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<ApiPollQuotaWarningEmailProps>) {
  const { t } = await createEmailI18n(locale);
  return sendRenderedEmail({
    to,
    subject:
      props.level === "at_limit"
        ? t("apiPollQuotaWarning_atLimitSubject", {
            defaultValue: "{spaceName} has reached its API poll limit",
            spaceName: props.spaceName,
          })
        : t("apiPollQuotaWarning_nearLimitSubject", {
            defaultValue: "{spaceName} is close to its API poll limit",
            spaceName: props.spaceName,
          }),
    element: (
      <ApiPollQuotaWarningEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
