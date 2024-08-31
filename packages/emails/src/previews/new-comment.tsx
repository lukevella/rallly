import { defaultEmailContext } from "../components/email-context";
import { NewCommentEmail } from "../templates/new-comment";

function NewCommentEmailPreview() {
  return (
    <NewCommentEmail
      name="Guest"
      title="Untitled Poll"
      authorName="Someone"
      pollUrl="https://rallly.co"
      disableNotificationsUrl="https://rallly.co"
      ctx={defaultEmailContext}
    />
  );
}

export default NewCommentEmailPreview;
