import { Head, Html, Preview } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { resolveChrome } from "../chrome";
import { previewChrome } from "../components/preview-chrome";
import {
  Body,
  Button,
  Container,
  Link,
  Signature,
  Text,
} from "../components/styled-components";
import { createEmailI18n } from "../i18n";
import type { SendArgs } from "../send";
import { sendRenderedEmail } from "../send";
import type { EmailChrome } from "../types";

export type ReviewRequestEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  /** First name, or empty when the account has none worth greeting. */
  firstName: string;
  siteName: string;
  reviewUrl: string;
  /** The site's reviewer rules, when its vendor terms require linking them. */
  guidelinesUrl?: string;
};

/**
 * A plain note from the founder, sent once per user a while after a poll
 * they finalized showed Rallly works for them. Deliberately unbranded: no
 * logo or footer badge, so it reads as a personal email.
 */
async function ReviewRequestEmail({
  locale = "en",
  chrome,
  firstName,
  siteName,
  reviewUrl,
  guidelinesUrl,
}: ReviewRequestEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("reviewRequest_preview", {
          defaultValue:
            "Would you leave a quick review of Rallly on {siteName}?",
          siteName,
        })}
      </Preview>
      <Body>
        <Container>
          <Text>
            {firstName
              ? t("reviewRequest_greeting", {
                  defaultValue: "Hi {firstName},",
                  firstName,
                })
              : t("reviewRequest_greetingNoName", {
                  defaultValue: "Hi there,",
                })}
          </Text>
          <Text>
            {t("reviewRequest_intro", {
              defaultValue:
                "I saw you just scheduled another meeting with Rallly. I hope it saved you some back-and-forth.",
            })}
          </Text>
          <Text>
            {t("reviewRequest_ask", {
              defaultValue:
                "Would you leave a quick review on {siteName}? It takes a couple of minutes, and reviews are how people looking for a scheduling tool decide whether to trust a small, independent one like ours.",
              siteName,
            })}
          </Text>
          <Button href={reviewUrl} color={chrome.primaryColor}>
            {t("reviewRequest_button", {
              defaultValue: "Write a review on {siteName}",
              siteName,
            })}
          </Button>
          {guidelinesUrl ? (
            <Text small light={true}>
              <Trans
                t={t}
                i18n={i18n}
                ns="emails"
                i18nKey="reviewRequest_guidelines"
                defaults="Reviews must follow the <a>{siteName} community guidelines</a>."
                values={{ siteName }}
                components={{
                  a: <Link color={chrome.primaryColor} href={guidelinesUrl} />,
                }}
              />
            </Text>
          ) : null}
          <Text>
            {t("reviewRequest_reply", {
              defaultValue:
                "Good, bad or somewhere in between, an honest review helps. And if something about Rallly is getting in your way, just reply. I read every reply.",
            })}
          </Text>
          <Text>
            {t("reviewRequest_thanks", {
              defaultValue: "Thanks,",
            })}
          </Text>
          <Signature />
        </Container>
      </Body>
    </Html>
  );
}

ReviewRequestEmail.PreviewProps = {
  locale: "en",
  chrome: previewChrome,
  firstName: "Jessie",
  siteName: "Capterra",
  reviewUrl: "https://www.capterra.com",
  guidelinesUrl: "https://www.capterra.com/legal/community-guidelines/",
} as ReviewRequestEmailProps;

export default ReviewRequestEmail;

/** Resolves false when the transport failed, so the queue can retry. */
export async function sendReviewRequestEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<ReviewRequestEmailProps>) {
  const { t } = await createEmailI18n(locale);
  return sendRenderedEmail({
    to,
    subject: t("reviewRequest_subject", {
      defaultValue: "A small favour?",
    }),
    element: (
      <ReviewRequestEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
