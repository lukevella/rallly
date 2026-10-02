import { Head, Hr, Html, Img, Preview } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { resolveChrome } from "../chrome";
import { EventDetails } from "../components/event-details";
import { PoweredBy } from "../components/powered-by";
import { previewChrome } from "../components/preview-chrome";
import {
  Body,
  Container,
  Heading,
  Strong,
  Text,
} from "../components/styled-components";
import { createEmailI18n } from "../i18n";
import type { SendArgs } from "../send";
import { sendRenderedEmail } from "../send";
import type { EmailChrome, EmailConferencing } from "../types";

export type EventRsvpConfirmationEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  title: string;
  hostName: string;
  response: "accepted" | "declined";
  date: string;
  time?: string;
  location?: string;
  conferencing?: EmailConferencing;
};

async function EventRsvpConfirmationEmail({
  title,
  hostName,
  response,
  date,
  time,
  location,
  conferencing,
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
                  b: <Strong />,
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
                  b: <Strong />,
                }}
              />
            )}
          </Text>
          <EventDetails
            date={date}
            time={time}
            location={location}
            conferencing={conferencing}
            baseUrl={chrome.baseUrl}
            locale={locale}
          />
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
  date: "Friday, 12th June 2020",
  time: "6:00 PM to 11:00 PM BST",
  location: "Codfather, 100 Fish Street, London",
  conferencing: {
    provider: "meet",
    url: "https://meet.google.com/oce-zdyd-aoq",
  },
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
