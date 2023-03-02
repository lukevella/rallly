import { Button, Container, Hr } from "@react-email/components";

import { EmailLayout } from "./components/email-layout";
import { Heading, Link, Section, Text } from "./components/styled-components";

type NewPollVerificationEmailProps = {
  title: string;
  name: string;
  verificationLink: string;
  adminLink: string;
};

export const NewPollVerificationEmail = ({
  title = "Untitled Poll",
  name = "Guest",
  verificationLink = "https://rallly.co",
  adminLink = "https://rallly.co/admin/abcdefg123",
}: NewPollVerificationEmailProps) => {
  return (
    <EmailLayout preview="Please verify your email address to turn on notifications">
      <Container>
        <Text>Hi {name},</Text>
        <Text>
          Your poll <strong>&quot;{title}&quot;</strong> has been created.
        </Text>
        <Text>
          To manage your poll use the <em>admin link</em> below.
        </Text>
        <Text>
          <Link href={adminLink}>
            <span className="font-mono">{adminLink}</span> &rarr;
          </Link>
        </Text>
        <Hr />
        <Section className="bg-gray-50 px-4">
          <Heading as="h4">
            Want to get notified when participants vote?
          </Heading>
          <Text>Verify your email address to turn on notifications.</Text>
          <Section>
            <Button
              className="bg-primary-500 rounded px-3 py-2 font-sans text-white"
              href={verificationLink}
            >
              Verify your email &rarr;
            </Button>
          </Section>
        </Section>
      </Container>
    </EmailLayout>
  );
};

export default NewPollVerificationEmail;
