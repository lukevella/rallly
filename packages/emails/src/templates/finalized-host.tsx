import { Column, Row, Section } from "@react-email/components";

import { defaultEmailContext, EmailContext } from "./_components/email-context";
import { EmailLayout } from "./_components/email-layout";
import { borderColor, Button, Text } from "./_components/styled-components";

export interface FinalizeHostEmailProps {
  date: string;
  day: string;
  dow: string;
  time: string;
  name: string;
  title: string;
  location: string | null;
  pollUrl: string;
  attendees: string[];
  ctx: EmailContext;
}

export const FinalizeHostEmail = ({
  name = "Guest",
  title = "Untitled Poll",
  pollUrl = "https://rallly.co",
  day = "12",
  dow = "Fri",
  date = "Friday, 12th June 2020",
  time = "6:00 PM to 11:00 PM BST",
  ctx = defaultEmailContext,
}: FinalizeHostEmailProps) => {
  return (
    <EmailLayout ctx={ctx} recipientName={name} preview="Final date booked!">
      <Text>
        <strong>{title}</strong> has been booked for:
      </Text>
      <Section>
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
        We&apos;ve notified participants and sent them calendar invites.
      </Text>
      <Text>
        <Button href={pollUrl}>View Event</Button>
      </Text>
    </EmailLayout>
  );
};

export default FinalizeHostEmail;
