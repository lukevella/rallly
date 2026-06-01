import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import {
  Button,
  Card,
  Heading,
  Link,
  Text,
} from "../components/styled-components";
import { createEmailTemplate } from "../create-email-template";
import type { EmailContext } from "../types";

export interface NewPollEmailProps {
  title: string;
  name: string;
  adminLink: string;
  participantLink: string;
  ctx: EmailContext;
}

export const NewPollEmail = ({
  title,
  adminLink,
  participantLink,
  ctx,
}: NewPollEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      preview={ctx.t("newPoll_preview", {
        defaultValue:
          "Share your participant link to start collecting responses.",
        ns: "emails",
      })}
    >
      <Heading>
        {ctx.t("newPoll_heading", {
          defaultValue: "New Poll Created",
          ns: "emails",
        })}
      </Heading>
      <Text>
        <Trans
          {...ctx.i18nProps}
          i18nKey="newPoll_content"
          values={{ title }}
          components={{
            b: <strong />,
          }}
          defaults="Your meeting poll titled <b>{title}</b> is ready! Share it using the link below:"
        />
      </Text>
      <Card style={{ textAlign: "center" }}>
        <Text style={{ textAlign: "center" }}>
          <Link color={ctx.primaryColor} href={participantLink}>
            {participantLink}
          </Link>
        </Text>
      </Card>
      <Button href={adminLink} color={ctx.primaryColor}>
        {ctx.t("newPoll_button", {
          defaultValue: "Manage Poll",
          ns: "emails",
        })}
      </Button>
    </EmailLayout>
  );
};

export const sendNewPollEmail = createEmailTemplate({
  component: NewPollEmail,
  subject: (props, ctx) =>
    ctx.t("newPoll_subject", {
      defaultValue: "Let's find a date for {title}!",
      title: props.title,
      ns: "emails",
    }),
});
