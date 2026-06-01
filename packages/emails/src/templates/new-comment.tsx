import { Trans } from "react-i18next/TransWithoutContext";

import type { NotificationBaseProps } from "../components/notification-email";
import NotificationEmail from "../components/notification-email";
import { Heading, Text } from "../components/styled-components";
import { createEmailTemplate } from "../create-email-template";

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
          {...ctx.i18nProps}
          i18nKey="newComment_heading"
          defaults="New Comment"
        />
      </Heading>
      <Text>
        <Trans
          {...ctx.i18nProps}
          i18nKey="newComment_content"
          defaults="<b>{authorName}</b> has commented on <b>{title}</b>."
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

export { NewCommentEmail };

export const sendNewCommentEmail = createEmailTemplate({
  component: NewCommentEmail,
  subject: (props, ctx) =>
    ctx.t("newComment_subject", {
      ns: "emails",
      defaultValue: "{authorName} has commented on {title}",
      authorName: props.authorName,
      title: props.title,
    }),
});
