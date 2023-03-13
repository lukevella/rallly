import { absoluteUrl } from "@rallly/utils";

import { EmailLayout } from "./components/email-layout";
import { Domain, Heading, Link, Text } from "./components/styled-components";
import { getDomain } from "./components/utils";

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
          register an account on{" "}
          <Link className="text-primary-500" href={absoluteUrl()}>
            {getDomain()}
          </Link>
          . If this wasn&apos;t you, please ignore this email.
        </>
      }
      recipientName={name}
      preview={`Your 6-digit code is: ${code}`}
    >
      <Text>
        Use this code to complete the verification process on <Domain />
      </Text>
      <Heading>Your 6-digit code is:</Heading>
      <Heading as="h1" className="font-sans tracking-widest" id="code">
        {code}
      </Heading>
      <Text light={true}>This code is valid for 15 minutes</Text>
    </EmailLayout>
  );
};

export default RegisterEmail;
