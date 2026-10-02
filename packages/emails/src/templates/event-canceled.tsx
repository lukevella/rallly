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

export type EventCanceledEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  title: string;
  hostName: string;
  date: string;
  time?: string;
  location?: string;
  conferencing?: EmailConferencing;
};

async function EventCanceledEmail({
  title,
  hostName,
  date,
  time,
  location,
  conferencing,
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
                b: <Strong />,
              }}
            />
          </Text>
          <EventDetails
            date={date}
            time={time}
            location={location}
            conferencing={conferencing}
            baseUrl={chrome.baseUrl}
            locale={locale}
          />
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
  date: "Friday, 12th June 2020",
  time: "6:00 PM to 11:00 PM BST",
  location: "Codfather, 100 Fish Street, London",
  conferencing: { provider: "meet" },
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
