import { EmailLayout } from "./components/email-layout";
import { Button, Card, Text } from "./components/styled-components";

export interface FinalizeHostEmailProps {
  date: string;
  name: string;
  title: string;
  location: string | null;
  pollUrl: string;
  attendees: string[];
}

export const FinalizeHostEmail = ({
  name = "Guest",
  title = "Untitled Poll",
  pollUrl = "https://rallly.co",
  date = "Friday, 12th June 2020 at 12:00pm",
}: FinalizeHostEmailProps) => {
  return (
    <EmailLayout recipientName={name} preview="Final date booked!">
      <Text>
        Well done for finding a date for <strong>{title}</strong>!
      </Text>
      <Text>Your date has been booked for:</Text>
      <Card>
        <Text style={{ fontWeight: "bold", textAlign: "center" }}>{date}</Text>
      </Card>
      <Text>
        We&apos;ve notified participants and send them calendar invites.
      </Text>
      <Text>
        <Button href={pollUrl}>View Event</Button>
      </Text>
    </EmailLayout>
  );
};

export default FinalizeHostEmail;
