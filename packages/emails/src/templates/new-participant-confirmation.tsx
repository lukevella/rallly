import { EmailLayout } from "./components/email-layout";
import { Button, Section, Text } from "./components/styled-components";

interface NewParticipantConfirmationEmailProps {
  name: string;
  title: string;
  editSubmissionUrl: string;
}
export const NewParticipantConfirmationEmail = ({
  title = "Untitled Poll",
  name = "Guest",
  editSubmissionUrl = "https://rallly.co",
}: NewParticipantConfirmationEmailProps) => {
  return (
    <EmailLayout preview="To edit your submission use the link below">
      <Text>Hi {name},</Text>
      <Text>
        Thank you for submitting your availability for <strong>{title}</strong>.
      </Text>
      <Text>To review your submission, use the link below:</Text>
      <Section>
        <Button id="editSubmissionUrl" href={editSubmissionUrl}>
          Review submission &rarr;
        </Button>
      </Section>
      <Text>
        <em className="text-slate-500">
          Keep this link safe to avoid others from editing your submission.
        </em>
      </Text>
    </EmailLayout>
  );
};

export default NewParticipantConfirmationEmail;
