import { EmailLayout } from "./components/email-layout";
import {
  NewPollBaseEmail,
  NewPollBaseEmailProps,
} from "./components/new-poll-base";

export const NewPollEmail = ({
  title = "Untitled Poll",
  name = "Guest",
  adminLink = "https://rallly.co/admin/abcdefg123",
}: NewPollBaseEmailProps) => {
  return (
    <EmailLayout preview="Please verify your email address to turn on notifications">
      <NewPollBaseEmail name={name} title={title} adminLink={adminLink} />
    </EmailLayout>
  );
};

export default NewPollEmail;
