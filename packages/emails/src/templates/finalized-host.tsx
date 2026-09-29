import { Head, Hr, Html, Img, Preview } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { resolveChrome } from "../chrome";
import { EventDetails } from "../components/event-details";
import { PoweredBy } from "../components/powered-by";
import { previewChrome } from "../components/preview-chrome";
import {
  Body,
  Button,
  Container,
  Heading,
  Strong,
  Text,
} from "../components/styled-components";
import { createEmailI18n } from "../i18n";
import type { SendArgs } from "../send";
import { sendRenderedEmail } from "../send";
import type { EmailChrome, EmailConferencing } from "../types";

type FinalizeHostEmailProps = {
  locale?: string;
  chrome: EmailChrome;
  date: string;
  time?: string;
  name: string;
  title: string;
  location?: string;
  conferencing?: EmailConferencing;
  pollUrl: string;
  attendees: string[];
};

async function FinalizeHostEmail({
  title,
  pollUrl,
  date,
  time,
  location,
  conferencing,
  locale = "en",
  chrome,
}: FinalizeHostEmailProps) {
  const { t, i18n } = await createEmailI18n(locale);
  return (
    <Html>
      <Head />
      <Preview>
        {t("finalizeHost_preview", {
          defaultValue:
            "Final date booked! We've notified participants and sent them calendar invites.",
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
            {t("finalizeHost_heading", { defaultValue: "Final date booked!" })}
          </Heading>
          <Text>
            <Trans
              t={t}
              i18n={i18n}
              ns="emails"
              i18nKey="finalizeHost_content"
              values={{ title }}
              components={{
                b: <Strong />,
              }}
              defaults="<b>{title}</b> has been booked for:"
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
          <Text>
            {t("finalizeHost_content2", {
              defaultValue:
                "We've notified participants and sent them calendar invites.",
            })}
          </Text>
          <Button href={pollUrl} color={chrome.primaryColor}>
            {t("finalizeHost_button", { defaultValue: "View Event" })}
          </Button>
          <Hr style={{ margin: "16px 0" }} />
          <PoweredBy chrome={chrome} locale={locale} />
        </Container>
      </Body>
    </Html>
  );
}

FinalizeHostEmail.PreviewProps = {
  name: "John Doe",
  location: "Codfather, 100 Fish Street, London",
  conferencing: {
    provider: "meet",
    url: "https://meet.google.com/oce-zdyd-aoq",
  },
  attendees: ["johndoe@example.com", "janedoe@example.com"],
  title: "Untitled Poll",
  pollUrl: "https://rallly.co",
  date: "Friday, 12th June 2020",
  time: "6:00 PM to 11:00 PM BST",
  locale: "en",
  chrome: previewChrome,
} as FinalizeHostEmailProps;

export default FinalizeHostEmail;

export async function sendFinalizeHostEmail({
  to,
  locale = "en",
  branding,
  props,
  ...rest
}: SendArgs<FinalizeHostEmailProps>) {
  const { t } = await createEmailI18n(locale);
  await sendRenderedEmail({
    to,
    subject: t("finalizeHost_subject", {
      defaultValue: "Date booked for {title}",
      title: props.title,
    }),
    element: (
      <FinalizeHostEmail
        {...props}
        locale={locale}
        chrome={resolveChrome(branding)}
      />
    ),
    ...rest,
  });
}
