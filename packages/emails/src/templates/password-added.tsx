import { Head, Hr, Html, Img, Preview } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { resolveChrome } from "../chrome";
import { PoweredBy } from "../components/powered-by";
import { previewChrome } from "../components/preview-chrome";
import {
  Body,
  Container,
  Heading,
  Link,
  Text,
} from "../components/styled-components";
import { createEmailI18n } from "../i18n";
import type { SendArgs } from "../send";
import { sendRenderedEmail } from "../send";
import type { EmailChrome } from "../types";

type PasswordAddedEmailProps = {
  locale?: string;
  chrome: EmailChrome;
};

async function PasswordAddedEmail({
  locale = "en",
  chrome,
}: PasswordAddedEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("passwordAdded_preview", {
          defaultValue: "A password was added to your account",
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
            {t("passwordAdded_heading", {
              defaultValue: "A password was added to your account",
            })}
          </Heading>
          <Text>
            {t("passwordAdded_text", {
              defaultValue:
                "You can now sign in with your email address and password.",
            })}
          </Text>
          <Hr />
          <Text small light={true}>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="passwordAdded_content2"
              defaults="You're receiving this email because a password was added to your account on <domain />. If this wasn't you, reset your password immediately and contact <a>{supportEmail}</a>."
              values={{ supportEmail: chrome.supportEmail }}
              components={{
                domain: (
                  <Link color={chrome.primaryColor} href={chrome.baseUrl}>
                    {chrome.domain}
                  </Link>
                ),
                a: (
                  <Link
                    color={chrome.primaryColor}
                    href={`mailto:${chrome.supportEmail}`}
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

PasswordAddedEmail.PreviewProps = {
  locale: "en",
  chrome: previewChrome,
} as PasswordAddedEmailProps;

export default PasswordAddedEmail;

export async function sendPasswordAddedEmail({
  to,
  locale = "en",
  branding,
  ...rest
}: SendArgs<PasswordAddedEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("passwordAdded_subject", {
      defaultValue: "A password was added to your account",
    }),
    element: (
      <PasswordAddedEmail locale={locale} chrome={resolveChrome(branding)} />
    ),
    ...rest,
  });
}
