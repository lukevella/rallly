import { Section } from "@react-email/components";

import { defaultEmailContext, EmailContext } from "./_components/email-context";
import { EmailLayout } from "./_components/email-layout";
import {
  Button,
  Domain,
  Heading,
  Text,
  trackingWide,
} from "./_components/styled-components";

interface LoginEmailProps {
  name: string;
  code: string;
  magicLink: string;
  ctx: EmailContext;
}

export const LoginEmail = ({
  code = "123456",
  magicLink = "https://rallly.co",
  ctx = defaultEmailContext,
}: LoginEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      footNote={
        <>
          You&apos;re receiving this email because a request was made to login
          to <Domain ctx={ctx} />. If this wasn&apos;t you, let us know by
          replying to this email.
        </>
      }
      preview="Use this link to log in on this device."
    >
      <Heading>Login</Heading>
      <Text>Enter this one-time 6-digit verification code:</Text>
      <Text
        style={{
          ...trackingWide,
          fontSize: "24px",
          fontWeight: "bold",
        }}
        id="code"
      >
        {code}
      </Text>
      <Section style={{ marginTop: 32 }}>
        <Button href={magicLink} id="magicLink">
          Log in to {ctx.domain}
        </Button>
        <Text light={true}>This code will expire in 15 minutes.</Text>
      </Section>
    </EmailLayout>
  );
};

export default LoginEmail;
