import { Head, Html, Img, Preview, Section } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { resolveChrome } from "../chrome";
import { previewChrome } from "../components/preview-chrome";
import {
  Body,
  Card,
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

type RegisterEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  code: string;
};

async function RegisterEmail({
  code,
  locale = "en",
  chrome,
}: RegisterEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("register_preview", {
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
            {t("register_heading", {
              defaultValue: "Verify your email address",
            })}
          </Heading>
          <Text>
            {t("register_text", {
              defaultValue:
                "Please use the following 6-digit verification code to verify your email",
            })}
          </Text>
          <Card style={{ textAlign: "center" }}>
            <Text
              style={{
                ...trackingWide,
                textAlign: "center",
                fontSize: "32px",
                fontWeight: "bold",
              }}
              id="code"
            >
              {code}
            </Text>
            <Text style={{ textAlign: "center" }} light={true}>
              {t("register_codeValid", {
                defaultValue: "This code is valid for 15 minutes",
              })}
            </Text>
          </Card>
          <Section>
            <Text light={true}>
              <Trans
                t={t}
                i18n={i18n}
                ns="emails"
                i18nKey="login_content2"
                defaults="You're receiving this email because a request was made to login to <domain />. If this wasn't you contact <a>{supportEmail}</a>."
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
          </Section>
          {!chrome.hideAttribution ? (
            <Section>
              <Text light={true}>
                <Trans
                  t={t}
                  i18n={i18n}
                  ns="emails"
                  i18nKey="common_poweredBy"
                  defaults="Powered by <a>{domain}</a>"
                  values={{ domain: "rallly.co" }}
                  components={{
                    a: (
                      <Link
                        color={chrome.primaryColor}
                        href="https://rallly.co?utm_source=email&utm_medium=transactional"
                      />
                    ),
                  }}
                />
              </Text>
            </Section>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}

RegisterEmail.PreviewProps = {
  code: "123456",
  locale: "en",
  chrome: previewChrome,
} as RegisterEmailProps;

export default RegisterEmail;

export async function sendRegisterEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<RegisterEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("register_subject", {
      defaultValue: "Please verify your email address",
    }),
    element: (
      <RegisterEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
