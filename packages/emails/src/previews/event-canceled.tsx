import { previewEmailContext } from "../components/email-context";
import { EventCanceledEmail } from "../templates/event-canceled";

export default function EventCanceledPreview() {
  return (
    <EventCanceledEmail
      title="Untitled Poll"
      hostName="Host"
      day="12"
      dow="Fri"
      date="Friday, 12th June 2020"
      time="6:00 PM to 11:00 PM BST"
      ctx={previewEmailContext}
    />
  );
}
