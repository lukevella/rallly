import { absoluteUrl } from "@rallly/utils";

import { EmailLayout } from "./components/email-layout";
import {
  Button,
  Card,
  Heading,
  Link,
  SubHeadingText,
  Text,
} from "./components/styled-components";
import { getDomain } from "./components/utils";

export interface NewPollEmailProps {
  title: string;
  name: string;
  adminLink: string;
  participantLink: string;
}

const ShareLink = ({
  title,
  participantLink,
  name,
  children,
}: React.PropsWithChildren<{
  name: string;
  title: string;
  participantLink: string;
}>) => {
  return (
    <Button
      href={`mailto:?subject=${encodeURIComponent(
        `Availability for ${title}`,
      )}&body=${encodeURIComponent(
        `Hi all,\nI'm trying to find the best date for ${title}.\nCan you please use the link below to choose your preferred dates:\n${participantLink}\nThank you.\n${name}`,
      )}`}
    >
      {children}
    </Button>
  );
};

const LinkContainer = (props: { href: string }) => {
  return (
    <Text
      style={{
        borderRadius: "4px",
        backgroundColor: "white",
        padding: "12px",
        border: "1px solid #E2E8F0",
      }}
    >
      <Link href={props.href} style={{ letterSpacing: 1 }}>
        {props.href}
      </Link>
    </Text>
  );
};

export const NewPollEmail = ({
  title = "Untitled Poll",
  name = "John",
  adminLink = "https://rallly.co/admin/abcdefg123",
  participantLink = "https://rallly.co/p/wxyz9876",
}: NewPollEmailProps) => {
  return (
    <EmailLayout
      footNote={
        <>
          You are receiving this email because a new poll was created with this
          email address on <Link href={absoluteUrl()}>{getDomain()}</Link>. If
          this wasn&apos;t you, please ignore this email.
        </>
      }
      recipientName={name}
      preview="Share your participant link to start collecting responses."
    >
      <Text>
        Your poll for <strong>{title}</strong> is live! Here are two links you
        will need to manage your poll.
      </Text>
      <Card>
        <Heading>Admin link</Heading>
        <SubHeadingText>
          Use this link to view results and make changes to your poll.
        </SubHeadingText>
        <LinkContainer href={adminLink} />
        <Text>
          <Button href={adminLink}>Go to admin page</Button>
        </Text>
      </Card>
      <Card>
        <Heading>Participant link</Heading>
        <SubHeadingText>
          Copy this link and share it with your participants to start collecting
          responses.
        </SubHeadingText>
        <LinkContainer href={participantLink} />
        <Text>
          <ShareLink
            title={title}
            name={name}
            participantLink={participantLink}
          >
            Share via email
          </ShareLink>
        </Text>
      </Card>
    </EmailLayout>
  );
};

export default NewPollEmail;
