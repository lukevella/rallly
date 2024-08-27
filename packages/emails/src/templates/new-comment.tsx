import { Trans } from "react-i18next/TransWithoutContext";

import { i18nInstance } from "../i18n";
import { defaultEmailContext, EmailContext } from "./_components/email-context";
import NotificationEmail, {
  NotificationBaseProps,
} from "./_components/notification-email";
import { Text } from "./_components/styled-components";

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
      <Text>
        <Trans
          i18n={i18nInstance}
          defaultValue={`{{authorName}} commented on your poll "{{title}}"`}
          i18nKey="newComment_content"
          values={{
            authorName,
            title,
          }}
          components={{
            b: <strong className="font-semibold" />,
          }}
        />
      </Text>
    </NotificationEmail>
  );
};

NewCommentEmail.getSubject = (
  props: NewCommentEmailProps,
  ctx: EmailContext,
) => {
  return i18nInstance.t("newComment_subject", {
    authorName: props.authorName,
    title: props.title,
  });
};

export default NewCommentEmail;
