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

type AccountDeletedEmailProps = {
  locale?: string;
  chrome: EmailChrome;
};

async function AccountDeletedEmail({
  locale = "en",
  chrome,
}: AccountDeletedEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("accountDeleted_preview", {
          defaultValue: "Your account has been deleted",
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
            {t("accountDeleted_heading", {
              defaultValue: "Your account has been deleted",
            })}
          </Heading>
          <Text>
            {t("accountDeleted_text", {
              defaultValue:
                "Your {appName} account has been permanently deleted, along with your polls, events, votes, and comments. This cannot be undone.",
              appName: chrome.appName,
            })}
          </Text>
          <Text>
            {t("accountDeleted_signUpAgain", {
              defaultValue:
                "You're welcome back any time. Creating a new account starts you fresh with the same email address.",
            })}
          </Text>
          <Hr />
          <Text small light={true}>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="accountDeleted_footer"
              defaults="You're receiving this email because an account on <domain /> was deleted. If this wasn't you, contact <a>{supportEmail}</a>."
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

AccountDeletedEmail.PreviewProps = {
  locale: "en",
  chrome: previewChrome,
} as AccountDeletedEmailProps;

export default AccountDeletedEmail;

export async function sendAccountDeletedEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<AccountDeletedEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("accountDeleted_subject", {
      defaultValue: "Your account has been deleted",
    }),
    element: (
      <AccountDeletedEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
