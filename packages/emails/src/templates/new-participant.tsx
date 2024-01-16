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
  ctx,
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
      <Text>
        <strong>{participantName}</strong> has responded to{" "}
        <strong>{title}</strong>.
      </Text>
    </NotificationEmail>
  );
};

export default NewParticipantEmail;
