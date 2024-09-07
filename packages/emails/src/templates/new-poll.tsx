import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import {
  Button,
  Card,
  Heading,
  Link,
  Text,
} from "../components/styled-components";
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
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="newPoll_content"
          ns="emails"
          values={{ title }}
          components={{
            b: <strong />,
          }}
          defaults="Your meeting poll titled <b>{{title}}</b> is ready! Share it using the link below:"
        />
      </Text>
      <Card style={{ textAlign: "center" }}>
        <Text style={{ textAlign: "center" }}>
          <Link href={participantLink}>{participantLink}</Link>
        </Text>
      </Card>
      <Button href={adminLink}>
        {ctx.t("newPoll_button", {
          defaultValue: "Manage Poll",
          ns: "emails",
        })}
      </Button>
    </EmailLayout>
  );
};

NewPollEmail.getSubject = (props: NewPollEmailProps, ctx: EmailContext) => {
  return ctx.t("newPoll_subject", {
    defaultValue: "Let's find a date for {{title}}!",
    title: props.title,
    ns: "emails",
  });
};

export default NewPollEmail;
