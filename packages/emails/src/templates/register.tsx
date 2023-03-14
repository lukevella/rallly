import { EmailLayout } from "./components/email-layout";
import { Domain, Heading, Text } from "./components/styled-components";

interface RegisterEmailProps {
  name: string;
  code: string;
}

export const RegisterEmail = ({
  name = "John",
  code = "123456",
}: RegisterEmailProps) => {
  return (
    <EmailLayout
      footNote={
        <>
          You&apos;re receiving this email because a request was made to
          register an account on <Domain />.
        </>
      }
      recipientName={name}
      preview={`Your 6-digit code is: ${code}`}
    >
      <Text>
        Please use the following 6-digit verification code to verify your email:
      </Text>
      <Heading as="h1" className="font-sans tracking-widest" id="code">
        {code}
      </Heading>
      <Text light={true}>This code is valid for 15 minutes</Text>
    </EmailLayout>
  );
};

export default RegisterEmail;
