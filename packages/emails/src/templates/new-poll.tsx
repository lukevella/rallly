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

export type NewPollEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  title: string;
  name: string;
  adminLink: string;
  participantLink: string;
};

async function NewPollEmail({
  title,
  adminLink,
  participantLink,
  locale = "en",
  chrome,
}: NewPollEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("newPoll_preview", {
          defaultValue:
            "Share your participant link to start collecting responses.",
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
            {t("newPoll_heading", {
              defaultValue: "New Poll Created",
            })}
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="newPoll_content"
              values={{ title }}
              components={{
                b: <strong />,
              }}
              defaults="Your meeting poll titled <b>{title}</b> is ready! Share it using the link below:"
            />
          </Text>
          <Text>
            <Link color={chrome.primaryColor} href={participantLink}>
              {participantLink}
            </Link>
          </Text>
          <Button href={adminLink} color={chrome.primaryColor}>
            {t("newPoll_button", {
              defaultValue: "Manage Poll",
            })}
          </Button>
          <Hr style={{ margin: "16px 0" }} />
          <PoweredBy chrome={chrome} locale={locale} />
        </Container>
      </Body>
    </Html>
  );
}

NewPollEmail.PreviewProps = {
  title: "Untitled Poll",
  name: "John Doe",
  adminLink: "https://rallly.co",
  participantLink: "https://rallly.co/invite/abc123",
  locale: "en",
  chrome: previewChrome,
} as NewPollEmailProps;

export default NewPollEmail;

export async function sendNewPollEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<NewPollEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("newPoll_subject", {
      defaultValue: "Let's find a date for {title}!",
      title: props.title,
    }),
    element: (
      <NewPollEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
