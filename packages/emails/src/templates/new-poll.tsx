import { defaultEmailContext, EmailContext } from "./_components/email-context";
import { EmailLayout } from "./_components/email-layout";
import {
  Button,
  Card,
  Heading,
  Link,
  Text,
} from "./_components/styled-components";

export interface NewPollEmailProps {
  title: string;
  name: string;
  adminLink: string;
  participantLink: string;
  ctx: EmailContext;
}

export const NewPollEmail = ({
  title = "Untitled Poll",
  adminLink = "https://rallly.co/admin/abcdefg123",
  participantLink = "https://rallly.co/invite/wxyz9876",
  ctx = defaultEmailContext,
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

export default NewPollEmail;
