import { EmailLayout } from "./components/email-layout";
import { Button, Link, Section, Text } from "./components/styled-components";

export interface NewCommentEmailProps {
  name: string;
  title: string;
  authorName: string;
  pollUrl: string;
  unsubscribeUrl: string;
}

export const NewCommentEmail = ({
  name = "Guest",
  title = "Untitled Poll",
  authorName = "Someone",
  pollUrl = "https://rallly.co",
  unsubscribeUrl = "https://rallly.co",
}: NewCommentEmailProps) => {
  return (
    <EmailLayout preview={`${authorName} has commented on ${title}`}>
      <Text>Hi {name},</Text>
      <Text>
        <strong>{authorName}</strong> has commented on <strong>{title}</strong>.
      </Text>
      <Section>
        <Button href={pollUrl}>Go to poll &rarr;</Button>
      </Section>
      <Text>
        <Link href={unsubscribeUrl}>
          Stop receiving notifications for this poll.
        </Link>
      </Text>
    </EmailLayout>
  );
};

export default NewCommentEmail;
