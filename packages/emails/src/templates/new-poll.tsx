import { Trans } from "react-i18next/TransWithoutContext";

import { EmailContext } from "../components/email-context";
import { EmailLayout } from "../components/email-layout";
import {
  Button,
  Card,
  Heading,
  Link,
  Text,
} from "../components/styled-components";

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
      preview="Share your participant link to start collecting responses."
    >
      <Heading>
        {ctx.t("newPoll_heading", { defaultValue: "New Poll Created" })}
      </Heading>
      <Text>
        <Trans
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="newPoll_body"
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
        {ctx.t("newPoll_button", { defaultValue: "Manage Poll" })} &rarr;
      </Button>
    </EmailLayout>
  );
};

NewPollEmail.getSubject = (props: NewPollEmailProps, ctx: EmailContext) => {
  return ctx.t("newPoll_subject", {
    defaultValue: "Let's find a date for {{title}}!",
    title: props.title,
  });
};

export default NewPollEmail;
