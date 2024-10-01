import { Trans } from "react-i18next/TransWithoutContext";

import NotificationEmail, {
  NotificationBaseProps,
} from "../components/notification-email";
import { Heading, Text } from "../components/styled-components";
import type { EmailContext } from "../types";

export interface NewCommentEmailProps extends NotificationBaseProps {
  authorName: string;
}

const NewCommentEmail = ({
  title,
  authorName,
  pollUrl,
  disableNotificationsUrl,
  ctx,
}: NewCommentEmailProps) => {
  return (
    <NotificationEmail
      ctx={ctx}
      title={title}
      pollUrl={pollUrl}
      disableNotificationsUrl={disableNotificationsUrl}
      preview={ctx.t("newComment_preview", {
        ns: "emails",
        defaultValue: "Go to your poll to see what they said.",
      })}
    >
      <Heading>
        <Trans
          i18n={ctx.i18n}
          ns="emails"
          i18nKey="newComment_heading"
          defaults="New Comment"
        />
      </Heading>
      <Text>
        <Trans
          i18n={ctx.i18n}
          ns="emails"
          i18nKey="newComment_content"
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
  return ctx.t("newComment_subject", {
    ns: "emails",
    defaultValue: "{{authorName}} has commented on {{title}}",
    authorName: props.authorName,
    title: props.title,
  });
};

export { NewCommentEmail };
