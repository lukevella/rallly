import { Heading } from "@react-email/heading";

import { EmailLayout } from "./components/email-layout";
import { Text } from "./components/styled-components";

interface VerificationCodeEmailProps {
  name: string;
  code: string;
}

export const VerificationCodeEmail = ({
  name = "Guest",
  code = "123456",
}: VerificationCodeEmailProps) => {
  return (
    <EmailLayout preview="Here is your 6-digit code">
      <Text>Hi {name},</Text>
      <Text>Your 6-digit code is:</Text>
      <Heading className="font-sans tracking-widest" id="code">
        {code}
      </Heading>
      <Text>
        <span className="text-slate-500">
          This code is valid for 10 minutes
        </span>
      </Text>
      <Text>Use this code to complete the verification process.</Text>
    </EmailLayout>
  );
};

export default VerificationCodeEmail;
