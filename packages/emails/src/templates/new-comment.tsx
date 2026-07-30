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

type NewCommentEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  title: string;
  authorName: string;
  content: string;
  pollUrl: string;
  disableNotificationsUrl: string;
};

const PREVIEW_LENGTH = 140;

async function NewCommentEmail({
  title,
  authorName,
  content,
  pollUrl,
  disableNotificationsUrl,
  locale = "en",
  chrome,
}: NewCommentEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  const previewText =
    content.length > PREVIEW_LENGTH
      ? `${content.slice(0, PREVIEW_LENGTH)}…`
      : content;
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
              i18nKey="newComment_heading"
              defaults="New Comment"
            />
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="newComment_content"
              defaults="<b>{authorName}</b> has commented on <b>{title}</b>."
              components={{ b: <strong /> }}
              values={{ authorName, title }}
            />
          </Text>
          <Section
            style={{
              borderLeft: `3px solid ${borderColor}`,
              paddingLeft: "16px",
            }}
          >
            <Text style={{ margin: 0, whiteSpace: "pre-wrap" }}>{content}</Text>
          </Section>
          <Text small light={true}>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="newComment_replyGuidance"
              defaults="Replying to this email will not reach {authorName}. To respond, add a comment on the poll."
              values={{ authorName }}
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

NewCommentEmail.PreviewProps = {
  title: "Untitled Poll",
  authorName: "Someone",
  content:
    "Hi everyone! I can make most of these times work, but Tuesday afternoon would be best for me.\nLooking forward to it!",
  pollUrl: "https://rallly.co",
  disableNotificationsUrl: "https://rallly.co",
  locale: "en",
  chrome: previewChrome,
} as NewCommentEmailProps;

export default NewCommentEmail;

export async function sendNewCommentEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<NewCommentEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("newComment_subject", {
      defaultValue: "{authorName} has commented on {title}",
      authorName: props.authorName,
      title: props.title,
    }),
    element: (
      <NewCommentEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
