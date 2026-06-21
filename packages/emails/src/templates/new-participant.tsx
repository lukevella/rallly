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
  Link,
  Text,
} from "../components/styled-components";
import { createEmailI18n } from "../i18n";
import type { SendArgs } from "../send";
import { sendRenderedEmail } from "../send";
import type { EmailChrome } from "../types";

type NewParticipantEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  title: string;
  participantName: string;
  pollUrl: string;
  disableNotificationsUrl: string;
};

async function NewParticipantEmail({
  title,
  participantName,
  pollUrl,
  disableNotificationsUrl,
  locale = "en",
  chrome,
}: NewParticipantEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("newParticipant_preview", {
          defaultValue: "Go to your poll to see the new response.",
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
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="newParticipant_heading"
              defaults="New Response"
            />
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="newParticipant_content"
              defaults="<b>{name}</b> has responded to <b>{title}</b>."
              components={{ b: <strong /> }}
              values={{ name: participantName, title }}
            />
          </Text>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="newParticipant_content2"
              defaults="Go to your poll to see the new response."
            />
          </Text>
          <Button href={pollUrl} color={chrome.primaryColor}>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="common_viewOn"
              defaults="View on {domain}"
              values={{ domain: chrome.domain }}
            />
          </Button>
          <Hr style={{ margin: "16px 0" }} />
          <Text small light={true}>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="common_disableNotifications"
              defaults="You can <a>manage your notification settings</a> to stop receiving these emails."
              components={{
                a: (
                  <Link
                    color={chrome.primaryColor}
                    style={{ whiteSpace: "nowrap" }}
                    href={disableNotificationsUrl}
                  />
                ),
              }}
            />
          </Text>
          <PoweredBy chrome={chrome} locale={locale} />
        </Container>
      </Body>
    </Html>
  );
}

NewParticipantEmail.PreviewProps = {
  participantName: "John Doe",
  title: "Untitled Poll",
  pollUrl: "https://rallly.co",
  disableNotificationsUrl: "https://rallly.co",
  locale: "en",
  chrome: previewChrome,
} as NewParticipantEmailProps;

export default NewParticipantEmail;

export async function sendNewParticipantEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<NewParticipantEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("newParticipant_subject", {
      defaultValue: "{name} has responded to {title}",
      name: props.participantName,
      title: props.title,
    }),
    element: (
      <NewParticipantEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
