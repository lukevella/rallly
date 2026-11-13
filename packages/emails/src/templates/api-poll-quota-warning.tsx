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
  Section,
  SmallText,
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
  /** When the count resets, already formatted for the locale. */
  resetDate: string;
  /** How far away the reset is, e.g. "in 3 weeks", formatted for the locale. */
  resetIn: string;
  settingsUrl: string;
};

const barColors = {
  near_limit: "#F59E0B",
  at_limit: "#DC2626",
};

/**
 * A table rather than nested divs, because Outlook ignores widths and
 * backgrounds on divs.
 */
function UsageBar({ percent, color }: { percent: number; color: string }) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      style={{
        borderCollapse: "separate",
        borderRadius: 4,
        overflow: "hidden",
        backgroundColor: "#E5E7EB",
      }}
    >
      <tbody>
        <tr>
          <td
            width={`${percent}%`}
            height={8}
            style={{ backgroundColor: color, height: 8, lineHeight: "8px" }}
          >
            &nbsp;
          </td>
          {percent < 100 ? (
            <td height={8} style={{ height: 8, lineHeight: "8px" }}>
              &nbsp;
            </td>
          ) : null}
        </tr>
      </tbody>
    </table>
  );
}

async function ApiPollQuotaWarningEmail({
  locale = "en",
  chrome,
  level,
  spaceName,
  used,
  limit,
  resetDate,
  resetIn,
  settingsUrl,
}: ApiPollQuotaWarningEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  const atLimit = level === "at_limit";
  const percent = Math.min(100, Math.round((used / limit) * 100));
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
          <Section>
            <UsageBar percent={percent} color={barColors[level]} />
            <SmallText style={{ margin: "8px 0 0" }}>
              {t("apiPollQuotaWarning_resets", {
                defaultValue:
                  "{percent}% used · Resets {resetIn}, on {resetDate}",
                percent,
                resetIn,
                resetDate,
              })}
            </SmallText>
          </Section>
          <Text>
            {atLimit
              ? t("apiPollQuotaWarning_atLimitBody", {
                  defaultValue:
                    "New polls created through the API are being rejected. Raise your monthly limit with the API add-on to resume right away, or wait until the count resets. Polls created in Rallly are not affected.",
                })
              : t("apiPollQuotaWarning_nearLimitBody", {
                  defaultValue:
                    "Once you reach the limit, new polls created through the API will be rejected until the count resets. Need a higher limit? The API add-on raises it every month.",
                })}
          </Text>
          <Button href={settingsUrl} color={chrome.primaryColor}>
            {t("apiPollQuotaWarning_button", {
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

ApiPollQuotaWarningEmail.PreviewProps = {
  locale: "en",
  chrome: previewChrome,
  level: "near_limit",
  spaceName: "My Team",
  used: 40,
  limit: 50,
  resetDate: "December 1, 2026",
  resetIn: "in 3 weeks",
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
