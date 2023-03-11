import { absoluteUrl } from "@rallly/utils";
import { Heading } from "@react-email/heading";

import { EmailLayout } from "./components/email-layout";
import { Link, Text } from "./components/styled-components";
import { removeProtocalFromUrl } from "./components/utils";

interface RegisterEmailProps {
  name: string;
  code: string;
}

export const RegisterEmail = ({
  name = "Guest",
  code = "123456",
}: RegisterEmailProps) => {
  return (
    <EmailLayout
      footNote={
        <>
          You&apos;re receiving this email because a request was made to
          register an account on{" "}
          <Link className="text-primary-500" href={absoluteUrl()}>
            {removeProtocalFromUrl(absoluteUrl())}
          </Link>
          .
        </>
      }
      recipientName={name}
      preview={`Your 6-digit code is: ${code}`}
    >
      <Text>Your 6-digit code is:</Text>
      <Heading className="font-sans tracking-widest" id="code">
        {code}
      </Heading>
      <Text>
        Use this code to complete the verification process on{" "}
        <Link href={absoluteUrl()}>{removeProtocalFromUrl(absoluteUrl())}</Link>
      </Text>
      <Text>
        <span className="text-gray-500">This code is valid for 15 minutes</span>
      </Text>
    </EmailLayout>
  );
};

export default RegisterEmail;
