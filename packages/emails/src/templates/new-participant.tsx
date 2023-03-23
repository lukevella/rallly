import NotificationEmail, {
  NotificationBaseProps,
} from "./components/notification-email";
import { Text } from "./components/styled-components";

export interface NewParticipantEmailProps extends NotificationBaseProps {
  participantName: string;
}

export const NewParticipantEmail = ({
  name = "John",
  title = "Untitled Poll",
  participantName = "Someone",
  pollUrl = "https://rallly.co",
  disableNotificationsUrl = "https://rallly.co",
}: NewParticipantEmailProps) => {
  return (
    <NotificationEmail
      name={name}
      title={title}
      pollUrl={pollUrl}
      disableNotificationsUrl={disableNotificationsUrl}
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
