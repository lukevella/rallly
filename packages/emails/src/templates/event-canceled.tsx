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
  borderColor,
  Container,
  Heading,
  Text,
} from "../components/styled-components";
import { createEmailI18n } from "../i18n";
import type { SendArgs } from "../send";
import { sendRenderedEmail } from "../send";
import type { EmailChrome } from "../types";

export type EventCanceledEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  title: string;
  hostName: string;
  day: string;
  dow: string;
  date: string;
  time: string;
};

async function EventCanceledEmail({
  title,
  hostName,
  day,
  dow,
  date,
  time,
  locale = "en",
  chrome,
}: EventCanceledEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("eventCanceledPreview", {
          defaultValue: "Event canceled",
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
            {t("eventCanceledHeading", {
              defaultValue: "Event canceled",
            })}
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="eventCanceledContent"
              defaults="<b>{hostName}</b> has canceled <b>{title}</b> that was scheduled for:"
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
          <Hr style={{ margin: "16px 0" }} />
          <PoweredBy chrome={chrome} locale={locale} />
        </Container>
      </Body>
    </Html>
  );
}

EventCanceledEmail.PreviewProps = {
  title: "Untitled Poll",
  hostName: "Host",
  day: "12",
  dow: "Fri",
  date: "Friday, 12th June 2020",
  time: "6:00 PM to 11:00 PM BST",
  locale: "en",
  chrome: previewChrome,
} as EventCanceledEmailProps;

export default EventCanceledEmail;

export async function sendEventCanceledEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<EventCanceledEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("eventCanceledSubject", {
      defaultValue: "Canceled: {title}",
      title: props.title,
    }),
    element: (
      <EventCanceledEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
