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
  location,
  pollUrl = "https://rallly.co",
  attendees = ["Luke", "Leia", "Han"],
  date = "Friday, 12th June 2020 at 12:00pm",
}: FinalizeHostEmailProps) => {
  return (
    <EmailLayout recipientName={name} preview="Final date booked!">
      <Text>You poll has been finalized.</Text>
      <Card>
        <Text>
          <strong>Title</strong>
          <br />
          {title}
        </Text>
        <Text>
          <strong>Date</strong>
          <br />
          {date}
        </Text>
        <Text>
          <strong>Location</strong>
          <br />
          {location || "No location specified"}
        </Text>
        <Text>
          <strong>{`${attendees.length} attendees`}</strong>
          <br />
          {attendees.join(", ")}
        </Text>
      </Card>
      <Text>
        <Button href={pollUrl}>View Event</Button>
      </Text>
    </EmailLayout>
  );
};

export default FinalizeHostEmail;
