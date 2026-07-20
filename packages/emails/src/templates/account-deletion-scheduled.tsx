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

type AccountDeletionScheduledEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  /** Preformatted, localized date (the caller owns date formatting). */
  deletionDate: string;
};

async function AccountDeletionScheduledEmail({
  deletionDate,
  locale = "en",
  chrome,
}: AccountDeletionScheduledEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("accountDeletionScheduled_preview", {
          defaultValue: "Your account will be deleted on {date}",
          date: deletionDate,
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
            {t("accountDeletionScheduled_heading", {
              defaultValue: "Your account is scheduled for deletion",
            })}
          </Heading>
          <Text>
            {t("accountDeletionScheduled_text", {
              defaultValue:
                "Your {appName} account is scheduled for deletion on {date}. Your polls, events, votes, and comments will be permanently deleted.",
              appName: chrome.appName,
              date: deletionDate,
            })}
          </Text>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="accountDeletionScheduled_cancel"
              defaults="If you change your mind, you can cancel the deletion from your <a>account settings</a> before then."
              components={{
                a: (
                  <Link
                    color={chrome.primaryColor}
                    href={`${chrome.baseUrl}/settings/profile`}
                  />
                ),
              }}
            />
          </Text>
          <Button
            href={`${chrome.baseUrl}/settings/profile`}
            color={chrome.primaryColor}
          >
            {t("accountDeletionScheduled_button", {
              defaultValue: "Manage Account",
            })}
          </Button>
          <Hr />
          <Text small light={true}>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="accountDeletionScheduled_footer"
              defaults="You're receiving this email because a request was made to delete an account on <domain />. If this wasn't you, sign in and cancel the deletion before then, or contact <a>{supportEmail}</a>."
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

AccountDeletionScheduledEmail.PreviewProps = {
  deletionDate: "August 2, 2026",
  locale: "en",
  chrome: previewChrome,
} as AccountDeletionScheduledEmailProps;

export default AccountDeletionScheduledEmail;

export async function sendAccountDeletionScheduledEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<AccountDeletionScheduledEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("accountDeletionScheduled_subject", {
      defaultValue: "Your account is scheduled for deletion",
    }),
    element: (
      <AccountDeletionScheduledEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
