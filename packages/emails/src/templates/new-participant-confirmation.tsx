import { useEmailContext } from "./components/email-context";
import { EmailLayout } from "./components/email-layout";
import { Button, Domain, Section, Text } from "./components/styled-components";

interface NewParticipantConfirmationEmailProps {
  name: string;
  title: string;
  editSubmissionUrl: string;
}
export const NewParticipantConfirmationEmail = ({
  title = "Untitled Poll",
  name = "John",
  editSubmissionUrl = "https://rallly.co",
}: NewParticipantConfirmationEmailProps) => {
  const { domain } = useEmailContext();
  return (
    <EmailLayout
      footNote={
        <>
          You are receiving this email because a response was submitted on{" "}
          <Domain />. If this wasn&apos;t you, please ignore this email.
        </>
      }
      recipientName={name}
      preview="To edit your response use the link below"
    >
      <Text>
        Your response to <strong>{title}</strong> has been submitted.
      </Text>
      <Text>
        While the poll is still open you can change your response using the link
        below.
      </Text>
      <Section>
        <Button id="editSubmissionUrl" href={editSubmissionUrl}>
          Review response on {domain}
        </Button>
      </Section>
    </EmailLayout>
  );
};

export default NewParticipantConfirmationEmail;
