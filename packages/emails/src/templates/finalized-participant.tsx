import {
  Column,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
} from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { resolveChrome } from "../chrome";
import { PoweredBy } from "../components/powered-by";
import { previewChrome } from "../components/preview-chrome";
import {
  Body,
  Button,
  borderColor,
  Container,
  Heading,
  Text,
} from "../components/styled-components";
import { createEmailI18n } from "../i18n";
import type { SendArgs } from "../send";
import { sendRenderedEmail } from "../send";
import type { EmailChrome } from "../types";

type FinalizeParticipantEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  date: string;
  day: string;
  dow: string;
  time: string;
  title: string;
  hostName: string;
  pollUrl: string;
};

async function FinalizeParticipantEmail({
  title,
  hostName,
  pollUrl,
  day,
  dow,
  date,
  time,
  locale = "en",
  chrome,
}: FinalizeParticipantEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("finalizeParticipant_preview", {
          defaultValue: "Final date booked!",
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
            {t("finalizeParticipant_heading", {
              defaultValue: "Final date booked!",
            })}
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="finalizeParticipant_content"
              defaults="<b>{hostName}</b> has booked <b>{title}</b> for the following date:"
              values={{ hostName, title }}
              components={{
                b: <strong />,
              }}
            />
          </Text>
          <Section data-testid="date-section">
            <Row>
              <Column style={{ width: 48 }}>
                <Section
                  style={{
                    borderRadius: 5,
                    margin: 0,
                    width: 48,
                    height: 48,
                    textAlign: "center",
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <Text
                    style={{ margin: "0 0 4px 0", fontSize: 10, lineHeight: 1 }}
                  >
                    {dow}
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      lineHeight: 1,
                      fontWeight: "bold",
                      margin: 0,
                    }}
                  >
                    {day}
                  </Text>
                </Section>
              </Column>
              <Column style={{ paddingLeft: 16 }} align="left">
                <Text style={{ margin: 0, fontWeight: "bold" }}>{date}</Text>
                <Text light={true} style={{ margin: 0 }}>
                  {time}
                </Text>
              </Column>
            </Row>
          </Section>
          <Text>
            {t("finalizeParticipant_content2", {
              defaultValue:
                "Please find attached a calendar invite for this event.",
            })}
          </Text>
          <Button href={pollUrl} color={chrome.primaryColor}>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="finalizeParticipant_button"
              defaults="View Event"
            />
          </Button>
          <Hr style={{ margin: "16px 0" }} />
          <PoweredBy chrome={chrome} locale={locale} />
        </Container>
      </Body>
    </Html>
  );
}

FinalizeParticipantEmail.PreviewProps = {
  title: "Untitled Poll",
  hostName: "Host",
  pollUrl: "https://rallly.co",
  day: "12",
  dow: "Fri",
  date: "Friday, 12th June 2020",
  time: "6:00 PM to 11:00 PM BST",
  locale: "en",
  chrome: previewChrome,
} as FinalizeParticipantEmailProps;

export default FinalizeParticipantEmail;

export async function sendFinalizeParticipantEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<FinalizeParticipantEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("finalizeParticipant_subject", {
      defaultValue: "Date booked for {title}",
      title: props.title,
    }),
    element: (
      <FinalizeParticipantEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
