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
      <Heading>New Poll Created</Heading>
      <Text>
        Your meeting poll titled <strong>{`"${title}"`}</strong> is ready! Share
        it using the link below:
      </Text>
      <Card style={{ textAlign: "center" }}>
        <Text style={{ textAlign: "center" }}>
          <Link href={participantLink}>{participantLink}</Link>
        </Text>
      </Card>
      <Button href={adminLink}>Manage Poll &rarr;</Button>
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
