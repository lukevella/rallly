import { Trans } from "react-i18next/TransWithoutContext";

import { EmailContext } from "../components/email-context";
import NotificationEmail, {
  NotificationBaseProps,
} from "../components/notification-email";
import { Heading, Text } from "../components/styled-components";

export interface NewCommentEmailProps extends NotificationBaseProps {
  authorName: string;
}

export const NewCommentEmail = ({
  name,
  title,
  authorName,
  pollUrl,
  disableNotificationsUrl,
  ctx,
}: NewCommentEmailProps) => {
  return (
    <NotificationEmail
      ctx={ctx}
      name={name}
      title={title}
      pollUrl={pollUrl}
      disableNotificationsUrl={disableNotificationsUrl}
      preview={ctx.t("new-comment:preview", {
        defaultValue: "Go to your poll to see what they said.",
      })}
    >
      <Heading>
        <Trans
          i18n={ctx.i18n}
          i18nKey="new-comment:heading"
          defaults="New Comment"
        />
      </Heading>
      <Text>
        <Trans
          i18n={ctx.i18n}
          i18nKey="new-comment:content"
          defaults="<b>{{authorName}}</b> has commented on <b>{{title}}</b>."
          components={{
            b: <strong />,
          }}
          values={{
            authorName,
            title,
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
  return ctx.t("new-comment:subject", {
    defaultValue: "{{authorName}} has commented on {{title}}",
    authorName: props.authorName,
    title: props.title,
  });
};

export default NewCommentEmail;
