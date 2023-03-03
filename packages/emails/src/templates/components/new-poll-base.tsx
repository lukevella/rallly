import { Container } from "@react-email/container";

import { Link, Text } from "./styled-components";

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
    </Container>
  );
};
