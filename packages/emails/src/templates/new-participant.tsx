import { Trans } from "react-i18next/TransWithoutContext";

import type { NotificationBaseProps } from "../components/notification-email";
import NotificationEmail from "../components/notification-email";
import { Heading, Text } from "../components/styled-components";
import { createEmailTemplate } from "../create-email-template";

export interface NewParticipantEmailProps extends NotificationBaseProps {
  participantName: string;
}

const NewParticipantEmail = ({
  title,
  participantName,
  pollUrl,
  disableNotificationsUrl,
  ctx,
}: NewParticipantEmailProps) => {
  return (
    <NotificationEmail
      ctx={ctx}
      title={title}
      pollUrl={pollUrl}
      disableNotificationsUrl={disableNotificationsUrl}
      preview={ctx.t("newParticipant_preview", {
        defaultValue: "Go to your poll to see the new response.",
        ns: "emails",
      })}
    >
      <Heading>
        {ctx.t("newParticipant_heading", {
          defaultValue: "New Response",
          ns: "emails",
        })}
      </Heading>
      <Text>
        <Trans
          {...ctx.i18nProps}
          i18nKey="newParticipant_content"
          defaults="<b>{name}</b> has responded to <b>{title}</b>."
          components={{
            b: <strong />,
          }}
          values={{ name: participantName, title }}
        />
      </Text>
      <Text>
        <Trans
          {...ctx.i18nProps}
          i18nKey="newParticipant_content2"
          defaults="Go to your poll to see the new response."
        />
      </Text>
    </NotificationEmail>
  );
};

export { NewParticipantEmail };

export const sendNewParticipantEmail = createEmailTemplate({
  component: NewParticipantEmail,
  subject: (props, ctx) =>
    ctx.t("newParticipant_subject", {
      defaultValue: "{name} has responded to {title}",
      name: props.participantName,
      title: props.title,
      ns: "emails",
    }),
});
