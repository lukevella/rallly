import { Heading } from "@react-email/heading";

import { EmailLayout } from "./components/email-layout";
import { Section, Text } from "./components/styled-components";

interface VerificationCodeEmailProps {
  name: string;
  code: string;
}

export const VerificationCodeEmail = ({
  name = "Guest",
  code = "123456",
}: VerificationCodeEmailProps) => {
  return (
    <EmailLayout preview={`Your 6-digit code is ${code}`}>
      <Text>Hi {name},</Text>
      <Text>Please use the code below to verify your email address.</Text>
      <Section className="rounded bg-gray-50 text-center">
        <Text>Your 6-digit code is:</Text>
        <Heading className="font-sans tracking-widest" id="code">
          {code}
        </Heading>
        <Text>
          <span className="text-slate-500">
            This code is valid for 15 minutes
          </span>
        </Text>
      </Section>
    </EmailLayout>
  );
};

export default VerificationCodeEmail;
