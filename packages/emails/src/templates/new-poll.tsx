import { absoluteUrl } from "@rallly/utils";

import { EmailLayout } from "./components/email-layout";
import { Heading, Link, Section, Text } from "./components/styled-components";
import { removeProtocalFromUrl } from "./components/utils";

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

const LinkContainer = (props: { link: string }) => {
  return (
    <Section className="rounded bg-gray-50 p-4">
      <Link href={props.link} className="font-mono">
        {props.link}
      </Link>
    </Section>
  );
};

export const NewPollEmail = ({
  title = "Untitled Poll",
  name = "Guest",
  adminLink = "https://rallly.co/admin/abcdefg123",
  participantLink = "https://rallly.co/p/wxyz9876",
}: NewPollEmailProps) => {
  return (
    <EmailLayout
      footNote={
        <>
          You are receiving this email because a new poll was created with this
          email address on{" "}
          <Link href={absoluteUrl()}>
            {removeProtocalFromUrl(absoluteUrl())}
          </Link>
          . If this wasn&apos;t you, please ignore this email.
        </>
      }
      recipientName={name}
      preview="Share your participant link to start collecting responses."
    >
      <Text>
        Your new poll is ready! Now lets find a date for{" "}
        <strong>{title}</strong>.
      </Text>
      <Text>
        Copy this link and share it with your participants to start collecting
        responses.
      </Text>
      <LinkContainer link={participantLink} />
      <Text>
        <ShareLink title={title} name={name} participantLink={participantLink}>
          Share via email &rarr;
        </ShareLink>
      </Text>
      <Heading>Your secret link</Heading>
      <Text>
        Use this link to access the admin page where you can view and edit your
        poll.
      </Text>
      <LinkContainer link={adminLink} />
      <Text>
        <Link href={adminLink}>Go to admin page &rarr;</Link>
      </Text>
    </EmailLayout>
  );
};

export default NewPollEmail;
