import { EmailLayout } from "./components/email-layout";
import { Button, Link, Section, Text } from "./components/styled-components";

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
      preview="Click the button to start receiving notifications"
      footNote={
        <>
          You are receiving this email because a request was made to enable
          notifications for <Link href={adminLink}>{title}</Link>.
        </>
      }
    >
      <Text>
        Please click the button below if you would like to get notified when
        participants respond to <strong>{title}</strong>.
      </Text>
      <Section>
        <Button href={verificationLink} id="verifyEmailUrl">
          Enable notifications &rarr;
        </Button>
      </Section>
    </EmailLayout>
  );
};

export default EnableNotificationsEmail;
