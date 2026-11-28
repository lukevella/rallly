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
  Strong,
  Text,
} from "../components/styled-components";
import { createEmailI18n } from "../i18n";
import type { SendArgs } from "../send";
import { sendRenderedEmail } from "../send";
import type { EmailChrome } from "../types";

type ExistingResponseEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  title: string;
  editSubmissionUrl: string;
};

async function ExistingResponseEmail({
  title,
  editSubmissionUrl,
  locale = "en",
  chrome,
}: ExistingResponseEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("existingResponse_preview", {
          defaultValue: "To change your response use the link below",
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
            {t("existingResponse_heading", {
              defaultValue: "You already responded",
            })}
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="existingResponse_content"
              defaults="A new response to <b>{title}</b> was submitted with this email address. This address already has a response on the poll, so the new one was not saved."
              components={{ b: <Strong /> }}
              values={{ title }}
            />
          </Text>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="existingResponse_content2"
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
              i18nKey="existingResponse_button"
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
              i18nKey="existingResponse_footnote"
              defaults="You are receiving this email because a response was submitted with this address on <domain />. If this wasn't you, please ignore this email."
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

ExistingResponseEmail.PreviewProps = {
  title: "Untitled Poll",
  editSubmissionUrl: "https://rallly.co",
  locale: "en",
  chrome: previewChrome,
} as ExistingResponseEmailProps;

export default ExistingResponseEmail;

export async function sendExistingResponseEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<ExistingResponseEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("existingResponse_subject", {
      defaultValue: "Your response to {title}",
      title: props.title,
    }),
    element: (
      <ExistingResponseEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
