import { absoluteUrl } from "@rallly/utils";

import { EmailLayout } from "./components/email-layout";
import { Button, Card, Link, Text } from "./components/styled-components";
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
    <Link
      href={`mailto:?subject=${encodeURIComponent(
        `Availability for ${title}`,
      )}&body=${encodeURIComponent(
        `Hi all,\nI'm trying to find the best date for ${title}.\nCan you please use the link below to choose your preferred dates:\n${participantLink}\nThank you.\n${name}`,
      )}`}
    >
      {children}
    </Link>
  );
};

export const NewPollEmail = ({
  title = "Untitled Poll",
  name = "John",
  adminLink = "https://rallly.co/admin/abcdefg123",
  participantLink = "https://rallly.co/invite/wxyz9876",
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
        Your poll has been successfully created! Here are the details:
      </Text>
      <Card>
        <Text>
          <strong>Title:</strong> {title}
          <br />
          <strong>Invite Link:</strong>{" "}
          <Link href={participantLink}>{participantLink}</Link>
        </Text>
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
      <Text>
        To invite participants to your poll, simply share the{" "}
        <strong>Invite Link</strong> above with them. They&apos;ll be able to
        vote on their preferred meeting times and dates.
      </Text>
      <Text>
        If you need to make any changes to your poll, or if you want to see the
        results so far, just click on the button below:
      </Text>
      <Text>
        <Button href={adminLink}>Manage Poll &rarr;</Button>
      </Text>
    </EmailLayout>
  );
};

export default NewPollEmail;
