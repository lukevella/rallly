import { absoluteUrl } from "@rallly/utils";
import { Hr } from "@react-email/components";
import { Container } from "@react-email/container";

import { Link, SmallText, Text } from "./styled-components";
import { removeProtocalFromUrl } from "./utils";

export interface NewPollBaseEmailProps {
  title: string;
  name: string;
  adminLink: string;
}

export const NewPollBaseEmail = ({
  name,
  title,
  adminLink,
  children,
}: React.PropsWithChildren<NewPollBaseEmailProps>) => {
  return (
    <Container>
      <Text>Hi {name},</Text>
      <Text>
        Your poll <strong>&quot;{title}&quot;</strong> has been created.
      </Text>
      <Text>
        To manage your poll use the <em>admin link</em> below.
      </Text>
      <Text>
        <Link href={adminLink}>
          <span className="font-mono">{adminLink}</span> &rarr;
        </Link>
      </Text>
      {children}
      <Hr />
      <SmallText>
        You are receiving this email because a new poll was created with this
        email address on{" "}
        <Link href={absoluteUrl()}>{removeProtocalFromUrl(absoluteUrl())}</Link>
      </SmallText>
    </Container>
  );
};
