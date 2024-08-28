import { Section } from "@react-email/components";
import { Hr } from "@react-email/hr";

import { defaultEmailContext, EmailContext } from "./_components/email-context";
import { EmailLayout } from "./_components/email-layout";
import {
  Button,
  Card,
  Heading,
  Link,
  Text,
} from "./_components/styled-components";

export interface NewPollEmailProps {
  title: string;
  name: string;
  adminLink: string;
  participantLink: string;
  ctx: EmailContext;
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
        `Hi all,\n\nI'm trying to find the best date for ${title}.\n\nCan you please use the link below to choose your preferred dates:\n\n${participantLink}\n\nThank you.\n\n${name}`,
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
  ctx = defaultEmailContext,
}: NewPollEmailProps) => {
  const { baseUrl, domain } = ctx;
  return (
    <EmailLayout
      ctx={ctx}
      footNote={
        <>
          You are receiving this email because a new poll was created with this
          email address on <Link href={baseUrl}>{domain}</Link>. If this
          wasn&apos;t you, please ignore this email.
        </>
      }
      preview="Share your participant link to start collecting responses."
    >
      <Heading>New Poll Created</Heading>
      <Text>
        Your poll has been successfully created! Here are the details:
      </Text>
      <Text>
        <strong>Title:</strong> {title}
        <br />
        <strong>Invite Link:</strong>{" "}
        <Link href={participantLink}>{participantLink}</Link>
      </Text>
      <Text>
        <ShareLink title={title} name={name} participantLink={participantLink}>
          Share via email
        </ShareLink>
      </Text>
      <Text>
        To invite participants to your poll, simply share the{" "}
        <strong>Invite Link</strong> above with them. They&apos;ll be able to
        vote on their preferred meeting times and dates.
      </Text>
      <Hr />
      <Text>
        If you need to make any changes to your poll, or if you want to see the
        results so far, just click on the button below:
      </Text>
      <Section style={{ marginTop: 32 }}>
        <Button href={adminLink}>Manage Poll &rarr;</Button>
      </Section>
    </EmailLayout>
  );
};

export default NewPollEmail;
