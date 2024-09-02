import { previewEmailContext } from "../components/email-context";
import { FinalizeParticipantEmail } from "../templates/finalized-participant";

export default function FinalizedParticipantPreview() {
  return (
    <FinalizeParticipantEmail
      title="Untitled Poll"
      hostName="Host"
      pollUrl="https://rallly.co"
      day="12"
      dow="Fri"
      date="Friday, 12th June 2020"
      time="6:00 PM to 11:00 PM BST"
      ctx={previewEmailContext}
    />
  );
}
