import { Trans } from "react-i18next/TransWithoutContext";

import NotificationEmail, {
  NotificationBaseProps,
} from "../components/notification-email";
import { Heading, Text } from "../components/styled-components";
import type { EmailContext } from "../types";

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
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="newParticipant_content"
          ns="emails"
          defaults="<b>{{name}}</b> has responded to <b>{{title}}</b>."
          components={{
            b: <strong />,
          }}
          values={{ name: participantName, title }}
        />
      </Text>
      <Text>
        <Trans
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="newParticipant_content2"
          defaults="Go to your poll to see the new response."
          ns="emails"
        />
      </Text>
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
    ns: "emails",
  });
};

export { NewParticipantEmail };
