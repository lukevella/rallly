import { defaultEmailContext } from "./_components/email-context";
import NotificationEmail, {
  NotificationBaseProps,
} from "./_components/notification-email";
import { Heading, Text } from "./_components/styled-components";

export interface NewParticipantEmailProps extends NotificationBaseProps {
  participantName: string;
}

export const NewParticipantEmail = ({
  name = "John",
  title = "Untitled Poll",
  participantName = "Someone",
  pollUrl = "https://rallly.co",
  disableNotificationsUrl = "https://rallly.co",
  ctx = defaultEmailContext,
}: NewParticipantEmailProps) => {
  return (
    <NotificationEmail
      ctx={ctx}
      name={name}
      title={title}
      pollUrl={pollUrl}
      disableNotificationsUrl={disableNotificationsUrl}
      preview="Go to your poll to see the new response."
    >
      <Heading>New Response</Heading>
      <Text>
        <strong>{participantName}</strong> has responded to{" "}
        <strong>{title}</strong>.
      </Text>
      <Text>Go to your poll to see the new response.</Text>
    </NotificationEmail>
  );
};

export default NewParticipantEmail;
