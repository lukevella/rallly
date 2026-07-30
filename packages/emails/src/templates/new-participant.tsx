import { Head, Hr, Html, Img, Preview } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { resolveChrome } from "../chrome";
import { PoweredBy } from "../components/powered-by";
import { previewChrome } from "../components/preview-chrome";
import {
  Body,
  Button,
  borderColor,
  Container,
  Heading,
  Link,
  Section,
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
  note?: string;
  canReply?: boolean;
  pollUrl: string;
  disableNotificationsUrl: string;
};

const PREVIEW_LENGTH = 140;

async function NewParticipantEmail({
  title,
  participantName,
  note,
  canReply,
  pollUrl,
  disableNotificationsUrl,
  locale = "en",
  chrome,
}: NewParticipantEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  const previewText = note
    ? note.length > PREVIEW_LENGTH
      ? `${note.slice(0, PREVIEW_LENGTH)}…`
      : note
    : t("newParticipant_preview", {
        defaultValue: "Go to your poll to see the new response.",
      });
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
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
          {note ? (
            <Section
              style={{
                borderLeft: `3px solid ${borderColor}`,
                paddingLeft: "16px",
              }}
            >
              <Text style={{ margin: 0, whiteSpace: "pre-wrap" }}>{note}</Text>
            </Section>
          ) : null}
          {note && canReply ? (
            <Text small light={true}>
              <Trans
                t={t}
                i18n={i18n}
                ns="emails"
                i18nKey="newParticipant_replyGuidance"
                defaults="You can reply to this email to respond to {name}."
                values={{ name: participantName }}
              />
            </Text>
          ) : null}
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
  note: "I can only make it after 2pm on Tuesday.\nLooking forward to it!",
  canReply: true,
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
