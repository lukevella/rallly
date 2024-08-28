import { defaultEmailContext, EmailContext } from "./_components/email-context";
import { EmailLayout } from "./_components/email-layout";
import {
  Domain,
  Heading,
  Text,
  trackingWide,
} from "./_components/styled-components";

interface RegisterEmailProps {
  code: string;
  ctx: EmailContext;
}

export const RegisterEmail = ({
  code = "123456",
  ctx = defaultEmailContext,
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
      preview={`Your 6-digit code is: ${code}`}
    >
      <Heading>Verify your email address</Heading>
      <Text>
        Please use the following 6-digit verification code to verify your email:
      </Text>
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
      <Text light={true}>This code is valid for 15 minutes</Text>
    </EmailLayout>
  );
};

export default RegisterEmail;
