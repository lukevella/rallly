import { Button, Container } from "@react-email/components";

import { EmailLayout } from "./components/email-layout";
import { Section, Text } from "./components/styled-components";

type GuestVerifyEmailProps = {
  title: string;
  name: string;
  verificationLink: string;
  adminLink: string;
};

export const GuestVerifyEmail = ({
  title = "Untitled Poll",
  name = "Guest",
  verificationLink = "https://rallly.co",
}: GuestVerifyEmailProps) => {
  return (
    <EmailLayout preview="Click the button below to verify your email">
      <Container>
        <Text>Hi {name},</Text>
        <Text>
          To receive notifications for <strong>&quot;{title}&quot;</strong> you
          will need to verify your email address.
        </Text>
        <Text>To verify your email please click the button below.</Text>
        <Section>
          <Button
            className="bg-primary-500 rounded px-3 py-2 font-sans text-white"
            href={verificationLink}
            id="verifyEmailUrl"
          >
            Verify your email &rarr;
          </Button>
        </Section>
      </Container>
    </EmailLayout>
  );
};

export default GuestVerifyEmail;
