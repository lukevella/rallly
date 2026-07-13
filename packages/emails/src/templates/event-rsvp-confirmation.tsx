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

export type EventRsvpConfirmationEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  title: string;
  hostName: string;
  response: "accepted" | "declined";
  day: string;
  dow: string;
  date: string;
  time?: string;
  location?: string;
};

async function EventRsvpConfirmationEmail({
  title,
  hostName,
  response,
  day,
  dow,
  date,
  time,
  location,
  locale = "en",
  chrome,
}: EventRsvpConfirmationEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {response === "accepted"
          ? t("eventRsvpConfirmationAcceptedPreview", {
              defaultValue: "You accepted {title}",
              title,
            })
          : t("eventRsvpConfirmationDeclinedPreview", {
              defaultValue: "You declined {title}",
              title,
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
            {response === "accepted"
              ? t("eventRsvpConfirmationAcceptedHeading", {
                  defaultValue: "You're going",
                })
              : t("eventRsvpConfirmationDeclinedHeading", {
                  defaultValue: "Response received",
                })}
          </Heading>
          <Text>
            {response === "accepted" ? (
              <Trans
                t={t}
                i18n={i18n}
                ns="emails"
                i18nKey="eventRsvpConfirmationAcceptedContent"
                defaults="You accepted the invitation to <b>{title}</b> hosted by <b>{hostName}</b>. The event is scheduled for:"
                values={{ hostName, title }}
                components={{
                  b: <strong />,
                }}
              />
            ) : (
              <Trans
                t={t}
                i18n={i18n}
                ns="emails"
                i18nKey="eventRsvpConfirmationDeclinedContent"
                defaults="You declined the invitation to <b>{title}</b> hosted by <b>{hostName}</b>. The event is scheduled for:"
                values={{ hostName, title }}
                components={{
                  b: <strong />,
                }}
              />
            )}
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
                  {time ?? t("allDay", { defaultValue: "All day" })}
                </Text>
              </Column>
            </Row>
          </Section>
          {location ? (
            <Text light={true} style={{ margin: "8px 0 0 0" }}>
              {location}
            </Text>
          ) : null}
          <Text>
            {t("eventRsvpConfirmationAttachmentNote", {
              defaultValue:
                "Please find attached a calendar invite for this event.",
            })}
          </Text>
          <Hr style={{ margin: "16px 0" }} />
          <PoweredBy chrome={chrome} locale={locale} />
        </Container>
      </Body>
    </Html>
  );
}

EventRsvpConfirmationEmail.PreviewProps = {
  title: "Team Offsite",
  hostName: "Host",
  response: "accepted",
  day: "12",
  dow: "Fri",
  date: "Friday, 12th June 2020",
  time: "6:00 PM to 11:00 PM BST",
  location: "Codfather, 100 Fish Street, London",
  locale: "en",
  chrome: previewChrome,
} as EventRsvpConfirmationEmailProps;

export default EventRsvpConfirmationEmail;

export async function sendEventRsvpConfirmationEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<EventRsvpConfirmationEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("eventRsvpConfirmationSubject", {
      defaultValue: "You responded to {title}",
      title: props.title,
    }),
    element: (
      <EventRsvpConfirmationEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
