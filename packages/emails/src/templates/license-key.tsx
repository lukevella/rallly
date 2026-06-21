import { Head, Html, Img, Preview } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { resolveChrome } from "../chrome";
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

type LicenseKeyEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  licenseKey: string;
  tier: string;
  seats: number;
};

async function LicenseKeyEmail({
  licenseKey,
  tier,
  seats,
  locale = "en",
  chrome,
}: LicenseKeyEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("license_key_preview", {
          defaultValue: "Your license key has been generated.",
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
            {t("license_key_heading", {
              defaultValue: "License confirmation",
            })}
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="license_key_content"
              defaults="Your purchase has been confirmed and your license key has been generated."
            />
          </Text>
          <Heading as="h2">
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="license_key_yourKey"
              defaults="License Details"
            />
          </Heading>
          <table>
            <tr>
              <td style={{ paddingRight: "16px" }}>
                <Trans
                  t={t}
                  i18n={i18n}
                  ns="emails"
                  i18nKey="license_key_plan"
                  defaults="Plan"
                />
              </td>
              <td>{tier}</td>
            </tr>
            <tr>
              <td style={{ paddingRight: "16px" }}>
                <Trans
                  t={t}
                  i18n={i18n}
                  ns="emails"
                  i18nKey="license_key_seats"
                  defaults="Seats"
                />
              </td>
              <td>{seats}</td>
            </tr>
            <tr>
              <td style={{ paddingRight: "16px" }}>
                <Trans
                  t={t}
                  i18n={i18n}
                  ns="emails"
                  i18nKey="license_key_licenseKey"
                  defaults="License Key"
                />
              </td>
              <td
                style={{
                  fontFamily: "monospace",
                  fontSize: "16px",
                  letterSpacing: "0.1em",
                }}
              >
                {licenseKey}
              </td>
            </tr>
          </table>
          <Heading as="h2">
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="license_key_nextStepsHeading"
              defaults="Next Steps"
            />
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="license_key_activationSteps"
              defaults={
                "Follow these <a>instructions</a> to activate your license on your Rallly Self-Hosted instance."
              }
              components={{
                a: (
                  <Link
                    color={chrome.primaryColor}
                    className="text-link"
                    href="https://support.rallly.co/self-hosting/licensing#activating-your-license"
                  />
                ),
              }}
            />
          </Text>
          <Heading as="h2">
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="license_key_questionsHeading"
              defaults="Questions?"
            />
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="license_key_support"
              defaults={
                "Reply to this email or contact us at <a>{supportEmail}</a> if you need help."
              }
              values={{ supportEmail: chrome.supportEmail }}
              components={{
                a: (
                  <Link
                    color={chrome.primaryColor}
                    className="text-link"
                    href={`mailto:${chrome.supportEmail}`}
                  />
                ),
              }}
            />
          </Text>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="license_key_signoff"
              defaults="Thank you for choosing Rallly!"
            />
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

LicenseKeyEmail.PreviewProps = {
  licenseKey: "RLYV4-ABCD-1234-ABCD-1234-XXXX",
  tier: "PLUS",
  seats: 5,
  locale: "en",
  chrome: previewChrome,
} as LicenseKeyEmailProps;

export default LicenseKeyEmail;

export async function sendLicenseKeyEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<LicenseKeyEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("license_key_subject", {
      defaultValue: "Your Rallly Self-Hosted {tier} License",
      tier: props.tier,
    }),
    element: (
      <LicenseKeyEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
