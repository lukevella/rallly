import { absoluteUrl } from "@rallly/utils";
import { Hr } from "@react-email/components";
import { Heading } from "@react-email/heading";

import { EmailLayout } from "./components/email-layout";
import { Link, Section, SmallText, Text } from "./components/styled-components";
import { removeProtocalFromUrl } from "./components/utils";

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
          to{" "}
          <Link href={absoluteUrl()}>
            {removeProtocalFromUrl(absoluteUrl())}
          </Link>
          . If this wasn&apos;t you, let us know by replying to this email.
        </>
      }
      recipientName={name}
      preview={`Your 6-digit code is ${code}`}
    >
      <Text>Your 6-digit code is:</Text>
      <Heading className="font-sans tracking-widest" id="code">
        {code}
      </Heading>
      <Text>
        <span className="text-slate-500">
          This code is valid for 15 minutes
        </span>
      </Text>
      <Text>
        Alternatively, you can login by using this{" "}
        <Link href={magicLink}>magic link ✨</Link>
      </Text>
    </EmailLayout>
  );
};

export default LoginEmail;
