import { EmailLayout } from "./components/email-layout";
import {
  Button,
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
  name = "Guest",
  verificationLink = "https://rallly.co",
  adminLink = "https://rallly.co",
}: EnableNotificationsEmailProps) => {
  return (
    <EmailLayout
      recipientName={name}
      preview="Before we can send you notifications we need to verify your email"
      footNote={
        <>
          You are receiving this email because a request was made to enable
          notifications for <Link href={adminLink}>{title}</Link>.
        </>
      }
    >
      <Text>
        Before we can send you notifications we need to verify your email.
      </Text>
      <Text>
        Click the button below to complete the email verification and enable
        notifications for <strong>{title}</strong>.
      </Text>
      <Section>
        <Button href={verificationLink} id="verifyEmailUrl">
          Enable notifications &rarr;
        </Button>
      </Section>
      <SmallText>The link will expire in 15 minutes.</SmallText>
    </EmailLayout>
  );
};

export default EnableNotificationsEmail;
