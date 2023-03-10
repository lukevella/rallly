import NotificationEmail, {
  NotificationEmailProps,
} from "./components/notification-email";
import { Text } from "./components/styled-components";

export interface NewParticipantEmailProps extends NotificationEmailProps {
  participantName: string;
}

export const NewParticipantEmail = ({
  name = "Guest",
  title = "Untitled Poll",
  participantName = "Someone",
  pollUrl = "https://rallly.co",
  unsubscribeUrl = "https://rallly.co",
}: NewParticipantEmailProps) => {
  return (
    <NotificationEmail
      name={name}
      title={title}
      pollUrl={pollUrl}
      unsubscribeUrl={unsubscribeUrl}
      preview={`${participantName} has responded`}
    >
      <Text>
        <strong>{participantName}</strong> has responded to{" "}
        <strong>{title}</strong>.
      </Text>
    </NotificationEmail>
  );
};

export default NewParticipantEmail;
