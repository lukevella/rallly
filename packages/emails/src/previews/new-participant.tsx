import { previewEmailContext } from "../components/email-context";
import { NewParticipantEmail } from "../templates/new-participant";

export default function NewParticipantPreview() {
  return (
    <NewParticipantEmail
      participantName="John Doe"
      title="Untitled Poll"
      pollUrl="https://rallly.co"
      disableNotificationsUrl="https://rallly.co"
      ctx={previewEmailContext}
    />
  );
}
