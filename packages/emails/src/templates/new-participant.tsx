import { EmailLayout } from "./components/email-layout";
import { Button, Link, Section, Text } from "./components/styled-components";

export interface NewParticipantEmailProps {
  name: string;
  title: string;
  participantName: string;
  pollUrl: string;
  unsubscribeUrl: string;
}

export const NewParticipantEmail = ({
  name = "Guest",
  title = "Untitled Poll",
  participantName = "Someone",
  pollUrl = "https://rallly.co",
  unsubscribeUrl = "https://rallly.co",
}: NewParticipantEmailProps) => {
  return (
    <EmailLayout preview={`${participantName} has responded`}>
      <Text>Hi {name},</Text>
      <Text>
        <strong>{participantName}</strong> has shared their availability for{" "}
        <strong>{title}</strong>.
      </Text>
      <Section>
        <Button href={pollUrl}>Go to poll &rarr;</Button>
      </Section>
      <Text>
        <Link href={unsubscribeUrl}>
          Stop receiving notifications for this poll.
        </Link>
      </Text>
    </EmailLayout>
  );
};

export default NewParticipantEmail;
