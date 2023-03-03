import { Button } from "@react-email/components";

import { EmailLayout } from "./components/email-layout";
import {
  NewPollBaseEmail,
  NewPollBaseEmailProps,
} from "./components/new-poll-base";
import { Heading, Section, Text } from "./components/styled-components";

export interface NewPollVerificationEmailProps extends NewPollBaseEmailProps {
  verificationLink: string;
}

export const NewPollVerificationEmail = ({
  title = "Untitled Poll",
  name = "Guest",
  verificationLink = "https://rallly.co",
  adminLink = "https://rallly.co/admin/abcdefg123",
}: NewPollVerificationEmailProps) => {
  return (
    <EmailLayout preview="Please verify your email address to turn on notifications">
      <NewPollBaseEmail name={name} title={title} adminLink={adminLink}>
        <Section className="bg-gray-50 px-4">
          <Heading as="h3">
            Want to get notified when participants vote?
          </Heading>
          <Text>Verify your email address to turn on notifications.</Text>
          <Section>
            <Button id="verifyEmailUrl" href={verificationLink}>
              Verify your email &rarr;
            </Button>
          </Section>
        </Section>
      </NewPollBaseEmail>
    </EmailLayout>
  );
};

export default NewPollVerificationEmail;
