import { EmailContext } from "./components/email-context";
import { EmailLayout } from "./components/email-layout";
import {
  Domain,
  Heading,
  Text,
  trackingWide,
} from "./components/styled-components";

interface RegisterEmailProps {
  name: string;
  code: string;
  ctx: EmailContext;
}

export const RegisterEmail = ({
  name = "John",
  code = "123456",
  ctx,
}: RegisterEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      footNote={
        <>
          You&apos;re receiving this email because a request was made to
          register an account on <Domain ctx={ctx} />. If this wasn&apos;t you,
          please ignore this email.
        </>
      }
      recipientName={name}
      preview={`Your 6-digit code is: ${code}`}
    >
      <Text>
        Please use the following 6-digit verification code to verify your email:
      </Text>
      <Heading as="h1" style={{ ...trackingWide }} id="code">
        {code}
      </Heading>
      <Text>This code is valid for 15 minutes</Text>
    </EmailLayout>
  );
};

export default RegisterEmail;
