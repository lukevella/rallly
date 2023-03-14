import { EmailLayout } from "./components/email-layout";
import { Button, Domain, Heading, Text } from "./components/styled-components";
import { getDomain } from "./components/utils";

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
      preview={`Your 6-digit code: ${code}`}
    >
      <Text>Use this link to log in on this device.</Text>
      <Button href={magicLink} id="magicLink">
        Log in to {getDomain()}
      </Button>
      <Text light={true}>This link is valid for 15 minutes</Text>
      <Text>
        Alternatively, you can enter this 6-digit verification code directly.
      </Text>
      <Heading as="h1" className="tracking-widest" id="code">
        {code}
      </Heading>
    </EmailLayout>
  );
};

export default LoginEmail;
