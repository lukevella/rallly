import { defaultEmailContext } from "./_components/email-context";
import NotificationEmail, {
  NotificationBaseProps,
} from "./_components/notification-email";
import { Heading, Text } from "./_components/styled-components";

export interface NewCommentEmailProps extends NotificationBaseProps {
  authorName: string;
}

export const NewCommentEmail = ({
  name = "Guest",
  title = "Untitled Poll",
  authorName = "Someone",
  pollUrl = "https://rallly.co",
  disableNotificationsUrl = "https://rallly.co",
  ctx = defaultEmailContext,
}: NewCommentEmailProps) => {
  return (
    <NotificationEmail
      ctx={ctx}
      name={name}
      title={title}
      pollUrl={pollUrl}
      disableNotificationsUrl={disableNotificationsUrl}
      preview="Go to your poll to see what they said."
    >
      <Heading>New Comment</Heading>
      <Text>
        <strong>{authorName}</strong> has commented on <strong>{title}</strong>.
      </Text>
    </NotificationEmail>
  );
};

export default NewCommentEmail;
