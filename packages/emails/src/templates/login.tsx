import { useEmailContext } from "./components/email-context";
import { EmailLayout } from "./components/email-layout";
import {
  Button,
  Card,
  Domain,
  Heading,
  Text,
  trackingWide,
} from "./components/styled-components";

interface LoginEmailProps {
  name: string;
  code: string;
  magicLink: string;
}

export const LoginEmail = ({
  name = "Guest",
  code = "123456",
  magicLink = "https://rallly.co",
}: LoginEmailProps) => {
  const { domain } = useEmailContext();
  return (
    <EmailLayout
      footNote={
        <>
          You&apos;re receiving this email because a request was made to login
          to <Domain />. If this wasn&apos;t you, let us know by replying to
          this email.
        </>
      }
      recipientName={name}
      preview="Use this link to log in on this device."
    >
      <Text>
        To log in to your account, please choose one of the following options:
      </Text>
      <Card>
        <Heading>Option 1: Magic Link</Heading>
        <Text>Click this magic link to log in on this device.</Text>
        <Button href={magicLink} id="magicLink">
          Log in to {domain}
        </Button>
        <Text light={true}>This link will expire in 15 minutes.</Text>
      </Card>
      <Card>
        <Heading>Option 2: Verification Code</Heading>
        <Text>Enter this one-time 6-digit verification code.</Text>
        <Heading as="h1" style={trackingWide} id="code">
          {code}
        </Heading>
        <Text light={true}>This code will expire in 15 minutes.</Text>
      </Card>
    </EmailLayout>
  );
};

export default LoginEmail;
