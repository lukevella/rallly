import { Column, Row, Section } from "@react-email/components";

import { EmailContext } from "./components/email-context";
import { EmailLayout } from "./components/email-layout";
import { borderColor, Button, Text } from "./components/styled-components";

export interface FinalizeParticipantEmailProps {
  date: string;
  day: string;
  dow: string;
  time: string;
  name: string;
  title: string;
  hostName: string;
  location: string | null;
  pollUrl: string;
  attendees: string[];
  ctx: EmailContext;
}

export const FinalizeParticipantEmail = ({
  name = "Guest",
  title = "Untitled Poll",
  hostName = "Host",
  pollUrl = "https://rallly.co",
  day = "12",
  dow = "Fri",
  date = "Friday, 12th June 2020",
  time = "6:00 PM to 11:00 PM BST",
  ctx,
}: FinalizeParticipantEmailProps) => {
  return (
    <EmailLayout ctx={ctx} recipientName={name} preview="Final date booked!">
      <Text>
        <strong>{hostName}</strong> has booked <strong>{title}</strong> for the
        following date:
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
      <Text>Please find attached a calendar invite for this event.</Text>
      <Text>
        <Button href={pollUrl}>View Event</Button>
      </Text>
    </EmailLayout>
  );
};

export default FinalizeParticipantEmail;
