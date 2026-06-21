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

type ResetPasswordEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  resetLink: string;
};

async function ResetPasswordEmail({
  resetLink,
  locale = "en",
  chrome,
}: ResetPasswordEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("resetPassword_preview", {
          defaultValue: "Use this link to reset your password.",
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
            {t("resetPassword_heading", {
              defaultValue: "Reset your password",
            })}
          </Heading>
          <Text>
            {t("resetPassword_content", {
              defaultValue:
                "We received a request to reset your password. Click the button below to create a new password.",
            })}
          </Text>
          <Button href={resetLink} id="resetLink" color={chrome.primaryColor}>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="resetPassword_button"
              defaults="Reset password"
            />
          </Button>
          <Hr style={{ margin: "16px 0" }} />
          <Text small light>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="resetPassword_content2"
              defaults="If you didn't request a password reset, you can ignore this email. Your password will not change unless you create a new one. If this request is suspicious, contact <a>{supportEmail}</a>."
              values={{ supportEmail: chrome.supportEmail }}
              components={{
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

ResetPasswordEmail.PreviewProps = {
  resetLink: "https://rallly.co",
  locale: "en",
  chrome: previewChrome,
} as ResetPasswordEmailProps;

export default ResetPasswordEmail;

export async function sendResetPasswordEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<ResetPasswordEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("resetPassword_subject", {
      defaultValue: "Reset your password",
    }),
    element: (
      <ResetPasswordEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
