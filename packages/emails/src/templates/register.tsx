import { Section } from "@react-email/section";

import { defaultEmailContext, EmailContext } from "./_components/email-context";
import { EmailLayout } from "./_components/email-layout";
import {
  Card,
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
    <EmailLayout ctx={ctx} preview={`Your 6-digit code is: ${code}`}>
      <Heading>Verify your email address</Heading>
      <Text>
        Please use the following 6-digit verification code to verify your email:
      </Text>
      <Card style={{ textAlign: "center" }}>
        <Text
          style={{
            ...trackingWide,
            textAlign: "center",
            fontSize: "32px",
            fontWeight: "bold",
          }}
          id="code"
        >
          {code}
        </Text>
        <Text style={{ textAlign: "center" }} light={true}>
          This code is valid for 15 minutes
        </Text>
      </Card>
      <Section>
        <Text light={true}>
          You&apos;re receiving this email because a request was made to
          register an account on <Domain ctx={ctx} />. If this wasn&apos;t you,
          please ignore this email.
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default RegisterEmail;
