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

export type PollInviteEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  hostName: string;
  pollTitle: string;
  inviteUrl: string;
};

async function PollInviteEmail({
  hostName,
  pollTitle,
  inviteUrl,
  locale = "en",
  chrome,
}: PollInviteEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("pollInvite_preview", {
          defaultValue: "{hostName} wants to know when you're available",
          hostName,
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
            {t("pollInvite_heading", { defaultValue: "You're invited" })}
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="pollInvite_content"
              defaults="<b>{hostName}</b> is finding a time for <b>{pollTitle}</b> and wants to know when you're available."
              values={{ hostName, pollTitle }}
              components={{ b: <strong /> }}
            />
          </Text>
          <Button href={inviteUrl} id="inviteUrl" color={chrome.primaryColor}>
            {t("pollInvite_button", { defaultValue: "Respond" })}
          </Button>
          <Text light={true}>
            {t("pollInvite_reply", {
              defaultValue: "Reply to this email to reach {hostName}",
              hostName,
            })}
          </Text>
          <Hr style={{ margin: "16px 0" }} />
          <PoweredBy chrome={chrome} locale={locale} />
        </Container>
      </Body>
    </Html>
  );
}

PollInviteEmail.PreviewProps = {
  hostName: "Jessie Smith",
  pollTitle: "Team offsite dates",
  inviteUrl: "https://rallly.co/invite/abc123?invite=token",
  locale: "en",
  chrome: previewChrome,
} as PollInviteEmailProps;

export default PollInviteEmail;

export async function sendPollInviteEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<PollInviteEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("pollInvite_subject", {
      defaultValue: "{hostName} invited you to respond to {pollTitle}",
      hostName: props.hostName,
      pollTitle: props.pollTitle,
    }),
    element: (
      <PollInviteEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
