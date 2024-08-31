import { defaultEmailContext, EmailContext } from "../components/email-context";
import NotificationEmail, {
  NotificationBaseProps,
} from "../components/notification-email";
import { Heading, Text } from "../components/styled-components";

export interface NewParticipantEmailProps extends NotificationBaseProps {
  participantName: string;
}

const NewParticipantEmail = ({
  title = "Untitled Poll",
  participantName = "Someone",
  pollUrl = "https://rallly.co",
  disableNotificationsUrl = "https://rallly.co",
  ctx = defaultEmailContext,
}: NewParticipantEmailProps) => {
  return (
    <NotificationEmail
      ctx={ctx}
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

NewParticipantEmail.getSubject = (
  props: NewParticipantEmailProps,
  ctx: EmailContext,
) => {
  return ctx.t("newParticipant_subject", {
    defaultValue: "{{name}} has responded to {{title}}",
    name: props.participantName,
    title: props.title,
  });
};

export { NewParticipantEmail };
