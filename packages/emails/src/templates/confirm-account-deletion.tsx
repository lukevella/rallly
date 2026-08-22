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
  trackingWide,
} from "../components/styled-components";
import { createEmailI18n } from "../i18n";
import type { SendArgs } from "../send";
import { sendRenderedEmail } from "../send";
import type { EmailChrome } from "../types";

type ConfirmAccountDeletionEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  code: string;
};

async function ConfirmAccountDeletionEmail({
  code,
  locale = "en",
  chrome,
}: ConfirmAccountDeletionEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("confirmAccountDeletion_preview", {
          defaultValue: "Your 6-digit code is: {code}",
          code,
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
            {t("confirmAccountDeletion_heading", {
              defaultValue: "Confirm your account deletion",
            })}
          </Heading>
          <Text>
            {t("confirmAccountDeletion_text", {
              defaultValue:
                "Please use the following 6-digit code to confirm that you want to delete your account. Your account and data will be deleted immediately and this cannot be undone.",
            })}
          </Text>
          <Text
            style={{
              ...trackingWide,
              fontSize: "32px",
              fontWeight: "bold",
            }}
            id="code"
          >
            {code}
          </Text>
          <Text light={true}>
            {t("confirmAccountDeletion_codeValid", {
              defaultValue: "This code is valid for 15 minutes",
            })}
          </Text>
          <Hr />
          <Text small light={true}>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="confirmAccountDeletion_footer"
              defaults="You're receiving this email because a request was made to delete an account on <domain />. If this wasn't you, your account has not been deleted. Sign in to secure it and contact <a>{supportEmail}</a>."
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

ConfirmAccountDeletionEmail.PreviewProps = {
  code: "123456",
  locale: "en",
  chrome: previewChrome,
} as ConfirmAccountDeletionEmailProps;

export default ConfirmAccountDeletionEmail;

export async function sendConfirmAccountDeletionEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<ConfirmAccountDeletionEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("confirmAccountDeletion_subject", {
      defaultValue: "Confirm your account deletion",
    }),
    element: (
      <ConfirmAccountDeletionEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
