import { EmailLayout } from "./components/email-layout";
import {
  Button,
  Card,
  Heading,
  Link,
  Section,
  SmallText,
  Text,
} from "./components/styled-components";

type EnableNotificationsEmailProps = {
  title: string;
  name: string;
  verificationLink: string;
  adminLink: string;
};

export const EnableNotificationsEmail = ({
  title = "Untitled Poll",
  name = "John",
  verificationLink = "https://rallly.co",
  adminLink = "https://rallly.co",
}: EnableNotificationsEmailProps) => {
  return (
    <EmailLayout
      recipientName={name}
      preview="We need to verify your email address"
      footNote={
        <>
          You are receiving this email because a request was made to enable
          notifications for <Link href={adminLink}>{title}</Link>.
        </>
      }
    >
      <Text>
        Would you like to get notified when participants respond to{" "}
        <strong>{title}</strong>?
      </Text>
      <Card>
        <Heading>Enable notifications</Heading>
        <Text>You will get an email when someone responds to the poll.</Text>
        <Section>
          <Button href={verificationLink} id="verifyEmailUrl">
            Yes, enable notifications
          </Button>
        </Section>
        <SmallText>The link will expire in 15 minutes.</SmallText>
      </Card>
    </EmailLayout>
  );
};

export default EnableNotificationsEmail;
