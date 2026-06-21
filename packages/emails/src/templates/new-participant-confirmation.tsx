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

type NewParticipantConfirmationEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  title: string;
  editSubmissionUrl: string;
};

async function NewParticipantConfirmationEmail({
  title,
  editSubmissionUrl,
  locale = "en",
  chrome,
}: NewParticipantConfirmationEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("newParticipantConfirmation_preview", {
          defaultValue: "To edit your response use the link below",
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
            {t("newParticipantConfirmation_heading", {
              defaultValue: "Poll Response Confirmation",
            })}
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="newParticipantConfirmation_content"
              defaults="Your response to <b>{title}</b> has been submitted."
              components={{ b: <strong /> }}
              values={{ title }}
            />
          </Text>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="newParticipantConfirmation_content2"
              defaults="While the poll is still open you can change your response using the link below."
            />
          </Text>
          <Button
            id="editSubmissionUrl"
            href={editSubmissionUrl}
            color={chrome.primaryColor}
          >
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="newParticipantConfirmation_button"
              defaults="Review response on {domain}"
              values={{ domain: chrome.domain }}
            />
          </Button>
          <Hr style={{ margin: "16px 0" }} />
          <Text small light={true}>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="newParticipantConfirmation_footnote"
              defaults="You are receiving this email because a response was submitted on <domain />. If this wasn't you, please ignore this email."
              components={{
                domain: (
                  <Link color={chrome.primaryColor} href={chrome.baseUrl}>
                    {chrome.domain}
                  </Link>
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

NewParticipantConfirmationEmail.PreviewProps = {
  title: "Untitled Poll",
  editSubmissionUrl: "https://rallly.co",
  locale: "en",
  chrome: previewChrome,
} as NewParticipantConfirmationEmailProps;

export default NewParticipantConfirmationEmail;

export async function sendNewParticipantConfirmationEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<NewParticipantConfirmationEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("newParticipantConfirmation_subject", {
      defaultValue: "Thanks for responding to {title}",
      title: props.title,
    }),
    element: (
      <NewParticipantConfirmationEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
