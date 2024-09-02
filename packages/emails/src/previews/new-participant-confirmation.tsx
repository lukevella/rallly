import { previewEmailContext } from "../components/email-context";
import NewParticipantConfirmationEmail from "../templates/new-participant-confirmation";

export default function NewParticipantConfirmationPreview() {
  return (
    <NewParticipantConfirmationEmail
      title="Untitled Poll"
      editSubmissionUrl="https://rallly.co"
      ctx={previewEmailContext}
    />
  );
}
