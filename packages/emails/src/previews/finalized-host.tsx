import { previewEmailContext } from "../components/email-context";
import { FinalizeHostEmail } from "../templates/finalized-host";

export default function FinalizedHostPreview() {
  return (
    <FinalizeHostEmail
      name="John Doe"
      location="Zoom"
      attendees={["johndoe@example.com", "janedoe@example.com"]}
      title="Untitled Poll"
      pollUrl="https://rallly.co"
      day="12"
      dow="Fri"
      date="Friday, 12th June 2020"
      time="6:00 PM to 11:00 PM BST"
      ctx={previewEmailContext}
    />
  );
}
